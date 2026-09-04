@echo off
set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC%" (
    set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "%CSC%" (
    echo Error: No se encontro el compilador de .NET Framework 4.0 (csc.exe)
    exit /b 1
)

echo ========================================================
echo Compilando PosVentasEspeciales en C# (.NET Framework 4.0)
echo ========================================================

"%CSC%" /target:winexe /out:PosVentasEspeciales.exe /r:System.dll,System.Core.dll,System.Data.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Web.Extensions.dll,System.Xml.dll Program.cs Models\User.cs Models\Product.cs Models\Customer.cs Models\SaleItem.cs Models\SaleRequest.cs Services\ApiService.cs Services\NumberToWords.cs Forms\FormLogin.cs Forms\FormProductSearch.cs Forms\FormCustomerSearch.cs Forms\FormCheckout.cs Forms\FormPOS.cs

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo Compilacion exitosa: PosVentasEspeciales.exe generado.
    echo ========================================================
) else (
    echo.
    echo Error en la compilacion.
)
