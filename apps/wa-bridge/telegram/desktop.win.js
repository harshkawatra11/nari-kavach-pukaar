const { spawn } = require("child_process");

const TIMEOUT_MS = 12000;

function runPowerShell(script, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: true });
    const out = [];
    const err = [];
    const timer = setTimeout(() => { child.kill(); reject(new Error("Telegram automation timed out")); }, timeoutMs);
    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => err.push(chunk));
    child.on("close", (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(out).toString("utf8").trim();
      const stderr = Buffer.concat(err).toString("utf8").trim();
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || `PowerShell exited ${code}`));
    });
  });
}

const PREAMBLE = String.raw`
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
$sig = @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int command);
[DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
[DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
[DllImport("user32.dll")] public static extern bool AttachThreadInput(uint from, uint to, bool attach);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
'@
Add-Type -MemberDefinition $sig -Name PukaarTelegramNative -Namespace Native
function Get-TelegramWindow {
  $p = Get-Process Telegram -ErrorAction SilentlyContinue | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1
  if ($null -eq $p) { throw 'telegram_not_running' }
  return $p
}
function Get-Root {
  $p = Get-TelegramWindow
  return [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
}
function Set-TelegramForeground {
  $p = Get-TelegramWindow
  $foreground = [Native.PukaarTelegramNative]::GetForegroundWindow()
  $owner = 0
  $foregroundThread = [Native.PukaarTelegramNative]::GetWindowThreadProcessId($foreground, [ref]$owner)
  $ourThread = [Native.PukaarTelegramNative]::GetCurrentThreadId()
  $attached = $false
  if ($foregroundThread -ne 0 -and $foregroundThread -ne $ourThread) {
    $attached = [Native.PukaarTelegramNative]::AttachThreadInput($ourThread, $foregroundThread, $true)
  }
  [Native.PukaarTelegramNative]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
  [Native.PukaarTelegramNative]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
  [Native.PukaarTelegramNative]::BringWindowToTop($p.MainWindowHandle) | Out-Null
  [Native.PukaarTelegramNative]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
  if ($attached) { [Native.PukaarTelegramNative]::AttachThreadInput($ourThread, $foregroundThread, $false) | Out-Null }
  Start-Sleep -Milliseconds 350
  $check = [Native.PukaarTelegramNative]::GetForegroundWindow()
  $checkOwner = 0
  [Native.PukaarTelegramNative]::GetWindowThreadProcessId($check, [ref]$checkOwner) | Out-Null
  if ($checkOwner -ne $p.Id) { throw 'telegram_focus_failed' }
}
function Find-Named([string]$name, [string]$type = '') {
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
  for ($i = 0; $i -lt $all.Count; $i++) {
    $e = $all.Item($i)
    if ($e.Current.Name -eq $name -and ($type -eq '' -or $e.Current.ControlType.ProgrammaticName -eq $type)) { return $e }
  }
  return $null
}
function Invoke-OrClick($element) {
  if ($null -eq $element) { throw 'control_not_found' }
  try {
    $pattern = $element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $pattern.Invoke()
    return
  } catch {}
  $r = $element.Current.BoundingRectangle
  [Native.PukaarTelegramNative]::SetCursorPos([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2)) | Out-Null
  [Native.PukaarTelegramNative]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
  [Native.PukaarTelegramNative]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
}
function Wait-Named([string]$name, [string]$type, [int]$timeoutMs) {
  $until = [DateTime]::UtcNow.AddMilliseconds($timeoutMs)
  while ([DateTime]::UtcNow -lt $until) {
    $e = Find-Named $name $type
    if ($null -ne $e) { return $e }
    Start-Sleep -Milliseconds 150
  }
  throw ('control_timeout:' + $name)
}
`;

async function isRunning() {
  return (await runPowerShell("@(Get-Process Telegram -ErrorAction SilentlyContinue | Where-Object MainWindowHandle -ne 0).Count").catch(() => "0")) !== "0";
}

async function focus() {
  const result = await runPowerShell(`${PREAMBLE}
Set-TelegramForeground
Write-Output 'OK'`);
  if (result !== "OK") throw new Error("telegram_focus_failed");
}

async function openSavedMessages() {
  await runPowerShell(`${PREAMBLE}
Set-TelegramForeground
$search = Wait-Named 'Search' 'ControlType.Edit' 5000
$r = $search.Current.BoundingRectangle
[Native.PukaarTelegramNative]::SetCursorPos([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2)) | Out-Null
[Native.PukaarTelegramNative]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
[Native.PukaarTelegramNative]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('^a')
[System.Windows.Forms.Clipboard]::SetText('Saved Messages')
[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 1000
$root = Get-Root
$all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
$self = $null
for ($i = 0; $i -lt $all.Count; $i++) {
  $e = $all.Item($i)
  if ($e.Current.ControlType.ProgrammaticName -eq 'ControlType.ListItem' -and $e.Current.Name -match '^Saved Messages,') { $self = $e; break }
}
if ($null -eq $self) { throw 'saved_messages_search_result_not_found' }
Invoke-OrClick $self
Start-Sleep -Milliseconds 800
Write-Output 'OK'`);
}

async function verifySavedMessages() {
  const result = await runPowerShell(`${PREAMBLE}
$p = Get-TelegramWindow
Write-Output ($p.MainWindowTitle -match 'Saved Messages')`);
  return result.trim() === "True";
}

async function openLocationPicker() {
  await runPowerShell(`${PREAMBLE}
Set-TelegramForeground
$attach = Wait-Named 'Add attachment' 'ControlType.Button' 5000
$r = $attach.Current.BoundingRectangle
[Native.PukaarTelegramNative]::SetCursorPos([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2)) | Out-Null
$location = Wait-Named 'Location' 'ControlType.MenuItem' 5000
Invoke-OrClick $location
$select = Wait-Named 'Select on the Map' 'ControlType.Button' 7000
Invoke-OrClick $select
$send = Wait-Named 'Send This Location' 'ControlType.Text' 7000
Write-Output 'OK'`, 28000);
}

async function waitForHumanSubmission(timeoutMs) {
  const result = await runPowerShell(`${PREAMBLE}
$send = Wait-Named 'Send This Location' 'ControlType.Text' 5000
$until = [DateTime]::UtcNow.AddMilliseconds(${Math.max(5000, Math.min(120000, Number(timeoutMs) || 45000))})
while ([DateTime]::UtcNow -lt $until) {
  if ($null -eq (Find-Named 'Send This Location' 'ControlType.Text')) { Write-Output 'CONFIRMED'; exit }
  Start-Sleep -Milliseconds 200
}
Write-Output 'TIMEOUT'`, Math.max(15000, Number(timeoutMs) + 10000));
  if (result !== "CONFIRMED") throw Object.assign(new Error("Location confirmation timed out"), { code: "confirmation_timeout" });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function copyLatestLocationLink() {
  return runPowerShell(`${PREAMBLE}
Set-TelegramForeground
[System.Windows.Forms.Clipboard]::SetText('__PUKAAR_LOCATION_PENDING__')
$root = Get-Root
$rr = $root.Current.BoundingRectangle
$all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
$candidate = $null; $bottom = -1
for ($i = 0; $i -lt $all.Count; $i++) {
  $e = $all.Item($i); $r = $e.Current.BoundingRectangle; $name = $e.Current.Name
  if ($e.Current.ControlType.ProgrammaticName -eq 'ControlType.ListItem' -and $name -match 'Location' -and $r.Bottom -gt $bottom -and $r.Width -gt 100 -and $r.Height -gt 80) { $candidate = $e; $bottom = $r.Bottom }
}
if ($null -eq $candidate) { throw 'location_card_not_found' }
$r = $candidate.Current.BoundingRectangle
$clickX = [int]($r.X + [Math]::Min(270, $r.Width * 0.25))
$clickY = [int]($r.Bottom - [Math]::Min(170, $r.Height * 0.48))
Set-TelegramForeground
[Native.PukaarTelegramNative]::SetCursorPos($clickX, $clickY) | Out-Null
[Native.PukaarTelegramNative]::mouse_event(8, 0, 0, 0, [UIntPtr]::Zero)
[Native.PukaarTelegramNative]::mouse_event(16, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 300
# Telegram renders this popup outside its UI Automation tree. Use a point relative
# to the verified card's right-click anchor, matching Telegram's fixed menu geometry.
[Native.PukaarTelegramNative]::SetCursorPos($clickX + 110, $clickY - 155) | Out-Null
[Native.PukaarTelegramNative]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
[Native.PukaarTelegramNative]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 1200
$value = [System.Windows.Forms.Clipboard]::GetText()
if ([string]::IsNullOrWhiteSpace($value) -or $value -eq '__PUKAAR_LOCATION_PENDING__') { throw 'copy_link_failed' }
Write-Output $value`, 20000);
}

async function getClipboard() {
  return runPowerShell("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::GetText()", 5000);
}

async function setClipboard(value) {
  if (String(value).length === 0) {
    await runPowerShell("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear()", 5000);
    return;
  }
  const encoded = Buffer.from(String(value), "utf8").toString("base64");
  await runPowerShell(`Add-Type -AssemblyName System.Windows.Forms; $v=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')); [System.Windows.Forms.Clipboard]::SetText($v)`, 5000);
}

async function resetToCleanState() {
  await runPowerShell(`${PREAMBLE}
Set-TelegramForeground
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 150
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Write-Output 'OK'`, 5000);
}

module.exports = { isRunning, focus, openSavedMessages, verifySavedMessages, openLocationPicker, waitForHumanSubmission, copyLatestLocationLink, resetToCleanState, getClipboard, setClipboard };
