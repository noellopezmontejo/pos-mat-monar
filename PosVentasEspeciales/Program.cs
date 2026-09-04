using System;
using System.Windows.Forms;
using PosVentasEspeciales.Forms;
using PosVentasEspeciales.Models;

namespace PosVentasEspeciales
{
    static class Program
    {
        /// <summary>
        /// Punto de entrada principal para la aplicación.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            using (var login = new FormLogin())
            {
                if (login.ShowDialog() == DialogResult.OK && login.AuthenticatedUser != null)
                {
                    Application.Run(new FormPOS(login.AuthenticatedUser));
                }
            }
        }
    }
}
