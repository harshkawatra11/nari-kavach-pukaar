const { spawn } = require("child_process");

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: true });
    const out = [];
    const err = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("foreground operation timed out"));
    }, 10000);
    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => err.push(chunk));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(Buffer.concat(err).toString("utf8").trim() || `powershell exited ${code}`));
      else resolve(Buffer.concat(out).toString("utf8").trim());
    });
  });
}

const API = `
$sig = @'
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
[DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int command);
[DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool AttachThreadInput(uint from, uint to, bool attach);
[DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
'@
Add-Type -MemberDefinition $sig -Name PukaarForeground -Namespace Native
`;

async function captureForegroundTarget() {
  const raw = await runPowerShell(`${API}
$h = [Native.PukaarForeground]::GetForegroundWindow()
$owner = 0
[Native.PukaarForeground]::GetWindowThreadProcessId($h, [ref]$owner) | Out-Null
$p = Get-Process -Id $owner -ErrorAction SilentlyContinue
if ($null -eq $p -or @('chrome','msedge') -notcontains $p.ProcessName.ToLowerInvariant()) { Write-Output 'UNSUPPORTED'; exit }
Write-Output ($h.ToInt64().ToString() + '|' + $owner + '|' + $p.ProcessName)
`);
  if (!raw || raw === "UNSUPPORTED") return null;
  const [handle, pid, processName] = raw.split("|");
  return { handle, pid: Number(pid), processName };
}

async function restoreForegroundTarget(target) {
  if (!target || !/^\d+$/.test(String(target.handle)) || !Number.isInteger(target.pid)) return false;
  const raw = await runPowerShell(`${API}
$h = [IntPtr]${target.handle}
if (-not [Native.PukaarForeground]::IsWindow($h)) { Write-Output 'False'; exit }
$owner = 0
[Native.PukaarForeground]::GetWindowThreadProcessId($h, [ref]$owner) | Out-Null
$p = Get-Process -Id $owner -ErrorAction SilentlyContinue
$foreground = [Native.PukaarForeground]::GetForegroundWindow()
$foregroundOwner = 0
$foregroundThread = [Native.PukaarForeground]::GetWindowThreadProcessId($foreground, [ref]$foregroundOwner)
$ourThread = [Native.PukaarForeground]::GetCurrentThreadId()
if ($owner -ne ${target.pid} -or $null -eq $p -or @('chrome','msedge') -notcontains $p.ProcessName.ToLowerInvariant()) { Write-Output 'False'; exit }
$attached = $false
if ($foregroundThread -ne 0 -and $foregroundThread -ne $ourThread) {
  $attached = [Native.PukaarForeground]::AttachThreadInput($ourThread, $foregroundThread, $true)
}
[Native.PukaarForeground]::ShowWindow($h, 9) | Out-Null
[Native.PukaarForeground]::BringWindowToTop($h) | Out-Null
[Native.PukaarForeground]::SetForegroundWindow($h) | Out-Null
if ($attached) { [Native.PukaarForeground]::AttachThreadInput($ourThread, $foregroundThread, $false) | Out-Null }
Start-Sleep -Milliseconds 450
Write-Output ([Native.PukaarForeground]::GetForegroundWindow() -eq $h)
`);
  return raw.trim() === "True";
}

module.exports = { captureForegroundTarget, restoreForegroundTarget };
