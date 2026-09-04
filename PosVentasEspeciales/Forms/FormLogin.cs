using System;
using System.Drawing;
using System.Windows.Forms;
using PosVentasEspeciales.Models;
using PosVentasEspeciales.Services;

namespace PosVentasEspeciales.Forms
{
    public class FormLogin : Form
    {
        private TextBox txtUsername;
        private TextBox txtPassword;
        private Button btnLogin;
        private Label lblError;
        private Label lblServerStatus;
        public User AuthenticatedUser { get; private set; }

        public FormLogin()
        {
            InitializeComponent();
            CheckServerConnection();
        }

        private void InitializeComponent()
        {
            this.Text = "Materiales Monar - Acceso al Punto de Venta";
            this.Size = new Size(460, 480);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate-900
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Encabezado con Logo / Título
            var pnlTop = new Panel
            {
                Dock = DockStyle.Top,
                Height = 130,
                BackColor = Color.FromArgb(30, 41, 59), // Slate-800
                Padding = new Padding(25, 20, 25, 10)
            };

            var lblBrand = new Label
            {
                Text = "MATERIALES MONAR",
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                ForeColor = Color.White,
                Dock = DockStyle.Top,
                Height = 35,
                TextAlign = ContentAlignment.MiddleCenter
            };

            var lblSubtitle = new Label
            {
                Text = "PUNTO DE VENTA - VENTAS ESPECIALES",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184), // Slate-400
                Dock = DockStyle.Top,
                Height = 22,
                TextAlign = ContentAlignment.MiddleCenter
            };

            var lblPrompt = new Label
            {
                Text = "Firme sus credenciales para iniciar turno",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Italic),
                ForeColor = Color.FromArgb(203, 213, 225),
                Dock = DockStyle.Top,
                Height = 22,
                TextAlign = ContentAlignment.MiddleCenter
            };

            pnlTop.Controls.Add(lblPrompt);
            pnlTop.Controls.Add(lblSubtitle);
            pnlTop.Controls.Add(lblBrand);

            // Contenedor Central
            var pnlBody = new Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(35, 25, 35, 15)
            };

            // Campo Usuario
            var lblUser = new Label
            {
                Text = "USUARIO / CÓDIGO DE CAJERO:",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(203, 213, 225),
                Location = new Point(35, 15),
                AutoSize = true
            };

            txtUsername = new TextBox
            {
                Location = new Point(35, 38),
                Width = 370,
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Text = "admin"
            };
            txtUsername.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Enter)
                {
                    txtPassword.Focus();
                    txtPassword.SelectAll();
                    e.Handled = true;
                }
            };

            // Campo Contraseña
            var lblPass = new Label
            {
                Text = "CONTRASEÑA / PIN:",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(203, 213, 225),
                Location = new Point(35, 85),
                AutoSize = true
            };

            txtPassword = new TextBox
            {
                Location = new Point(35, 108),
                Width = 370,
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                PasswordChar = '●'
            };
            txtPassword.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Enter)
                {
                    PerformLogin();
                    e.Handled = true;
                }
            };

            // Mensaje de Error
            lblError = new Label
            {
                Location = new Point(35, 150),
                Width = 370,
                Height = 35,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(239, 68, 68), // Red-500
                TextAlign = ContentAlignment.MiddleCenter,
                Visible = false
            };

            // Botón de Ingreso
            btnLogin = new Button
            {
                Text = "INGRESAR AL POS [Enter]",
                Location = new Point(35, 190),
                Width = 370,
                Height = 48,
                Font = new Font("Segoe UI", 11f, FontStyle.Bold),
                BackColor = Color.FromArgb(37, 99, 235), // Blue-600
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += (s, e) => PerformLogin();

            // Estado del Servidor
            lblServerStatus = new Label
            {
                Location = new Point(35, 250),
                Width = 370,
                Height = 20,
                Font = new Font("Segoe UI", 8f),
                ForeColor = Color.FromArgb(148, 163, 184),
                TextAlign = ContentAlignment.MiddleCenter,
                Text = "Verificando conexión con el servidor..."
            };

            pnlBody.Controls.Add(lblUser);
            pnlBody.Controls.Add(txtUsername);
            pnlBody.Controls.Add(lblPass);
            pnlBody.Controls.Add(txtPassword);
            pnlBody.Controls.Add(lblError);
            pnlBody.Controls.Add(btnLogin);
            pnlBody.Controls.Add(lblServerStatus);

            this.Controls.Add(pnlBody);
            this.Controls.Add(pnlTop);

            this.KeyPreview = true;
            this.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Escape)
                {
                    this.DialogResult = DialogResult.Cancel;
                    this.Close();
                }
            };

            this.Shown += (s, e) =>
            {
                if (string.IsNullOrEmpty(txtUsername.Text))
                {
                    txtUsername.Focus();
                }
                else
                {
                    txtPassword.Focus();
                    txtPassword.SelectAll();
                }
            };
        }

        private void CheckServerConnection()
        {
            try
            {
                var products = ApiService.SearchProducts("CEM");
                lblServerStatus.Text = "🟢 Servidor conectado (" + ApiService.BaseUrl + ")";
                lblServerStatus.ForeColor = Color.FromArgb(52, 211, 153); // Emerald-400
            }
            catch
            {
                lblServerStatus.Text = "🟠 Modo Offline / Servidor Local";
                lblServerStatus.ForeColor = Color.FromArgb(251, 191, 36); // Amber-400
            }
        }

        private void PerformLogin()
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text;

            if (string.IsNullOrEmpty(username))
            {
                ShowError("Por favor teclee su nombre de usuario o código.");
                txtUsername.Focus();
                return;
            }

            btnLogin.Enabled = false;
            btnLogin.Text = "AUTENTICANDO...";
            lblError.Visible = false;

            try
            {
                var resp = ApiService.Login(username, password);

                if (resp != null && resp.user != null)
                {
                    AuthenticatedUser = resp.user;
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }
                else
                {
                    ShowError(resp != null && !string.IsNullOrEmpty(resp.error) ? resp.error : "Credenciales incorrectas.");
                    txtPassword.Clear();
                    txtPassword.Focus();
                }
            }
            catch (Exception ex)
            {
                ShowError("Error de autenticación: " + ex.Message);
            }
            finally
            {
                btnLogin.Enabled = true;
                btnLogin.Text = "INGRESAR AL POS [Enter]";
            }
        }

        private void ShowError(string msg)
        {
            lblError.Text = msg;
            lblError.Visible = true;
        }
    }
}
