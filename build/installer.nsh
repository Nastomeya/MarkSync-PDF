; Kill any running instance of the app BEFORE the installer checks for running processes.
; This prevents the "cannot be closed" dialog from ever appearing.
!macro customInit
  nsExec::ExecToStack 'taskkill /F /IM "MarkSync PDF.exe" /T'
  Sleep 1500
!macroend

; Override the built-in running-process check with an empty macro.
; Since we already killed the process in customInit above,
; this suppresses the "MarkSync PDF cannot be closed" error dialog entirely.
!macro customCheckAppRunning
!macroend
