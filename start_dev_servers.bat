@echo off
echo Starting development servers...

:: --- Set Absolute Paths (Optional but safer) ---
:: You can uncomment these lines and set absolute paths if relative paths cause issues
:: set BACKEND_DIR=C:\Users\YADO-0072\Desktop\candidate-evaluator-app\backend
:: set FRONTEND_DIR=C:\Users\YADO-0072\Desktop\candidate-evaluator-app\frontend

:: --- バックエンドサーバーの起動 ---
echo Starting Backend server...
:: バックエンドディレクトリに移動し、venvを有効化して、別ウィンドウでPythonサーバーを起動
:: Using relative paths from the project root where this .bat file resides
start "Backend Server" cmd /k "cd backend && .\venv\Scripts\activate && python run.py"
:: Or using absolute paths (uncomment the set commands above)
:: start "Backend Server" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && python run.py"

:: 少し待機 (サーバー起動間の衝突を避けるため)
timeout /t 3 /nobreak > nul

:: --- フロントエンドサーバーの起動 ---
echo Starting Frontend server...
:: フロントエンドディレクトリに移動し、別ウィンドウでNPM開発サーバーを起動
:: Using relative paths
start "Frontend Server" cmd /k "cd frontend && npm start"
:: Or using absolute paths (uncomment the set commands above)
:: start "Frontend Server" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo Both servers are starting in separate windows. Check each window for status.
echo To stop the servers, press Ctrl+C in each of the new windows and confirm with 'Y'.