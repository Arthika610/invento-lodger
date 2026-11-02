@echo off
title InventoLedger - Multi-Branch Retail Inventory System
echo ===================================================================
echo   INVENTOLEDGER: Multi-Branch Retail Inventory System
echo   Roll Numbers: 24091A3215, 24091A3222
echo ===================================================================
echo.

set NODE_EXEC=node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Users\kakhi\AppData\Local\ms-playwright-go\1.50.1\node.exe" (
        set "NODE_EXEC=C:\Users\kakhi\AppData\Local\ms-playwright-go\1.50.1\node.exe"
    ) else (
        echo [ERROR] Node.js executable was not found.
        pause
        exit /b 1
    )
)


echo [1/2] Starting InventoLedger HTTP Server & Database Engine...
start "" "%NODE_EXEC%" server.js

timeout /t 2 /nobreak >nul

echo [2/2] Opening InventoLedger in your default web browser...
start http://localhost:3000

echo.
echo Server is running live at http://localhost:3000
echo Keep this window open or close it when finished.
pause
