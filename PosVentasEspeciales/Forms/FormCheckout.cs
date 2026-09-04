using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using PosVentasEspeciales.Models;
using PosVentasEspeciales.Services;

namespace PosVentasEspeciales.Forms
{
    public class FormCheckout : Form
    {
        private List<SaleItem> _cart;
        private decimal _total;
        private string _saleType;
        private Customer _customer;

        public string SelectedPaymentMethod { get; private set; }
        public bool IsDelivery { get; private set; }
        public string DeliveryAddress { get; private set; }

        private string activeTab = "payment"; // "payment" o "delivery"

        // Controles de Tabs
        private Button btnTabPago;
        private Button btnTabEnvio;
        private Panel pnlTabPaymentContent;
        private Panel pnlTabDeliveryContent;

        // Métodos de Pago
        private Button btnCaja;
        private Button btnContraEntrega;
        private Button btnCredito;

        // Opciones de Envío
        private Button btnToggleDelivery;
        private RadioButton rbCliente;
        private RadioButton rbOtra;
        private TextBox txtDeliveryAddress;

        // Botón Finalizar
        private Button btnFinalizar;

        public FormCheckout(List<SaleItem> cart, decimal total, string saleType, Customer customer)
        {
            _cart = cart ?? new List<SaleItem>();
            _total = total;
            _saleType = string.IsNullOrEmpty(saleType) ? "Remisión" : saleType;
            _customer = customer ?? Customer.DefaultCustomer;
            SelectedPaymentMethod = "PAGO_EN_CAJA";
            IsDelivery = false;
            DeliveryAddress = _customer.address ?? "";

            InitializeCustomDesign();
            UpdateTabUI();
            UpdatePaymentMethodUI();
            UpdateDeliveryUI();
        }

        private void InitializeCustomDesign()
        {
            this.Text = "Confirmar " + _saleType;
            this.Size = new Size(1020, 640);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Borde redondeado suave para el formulario
            this.Paint += (s, e) =>
            {
                using (var pen = new Pen(Color.FromArgb(226, 232, 240), 2))
                {
                    e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                    e.Graphics.DrawRectangle(pen, 1, 1, this.Width - 2, this.Height - 2);
                }
            };

            // ==============================================================
            // PANEL IZQUIERDO (Resumen de Partidas y Totales) - Ancho ~560px
            // ==============================================================
            var pnlLeft = new Panel
            {
                Dock = DockStyle.Left,
                Width = 560,
                BackColor = Color.FromArgb(250, 252, 255),
                Padding = new Padding(35, 30, 25, 30)
            };

            // Encabezado Izquierdo
            var pnlLeftHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 70,
                BackColor = Color.Transparent
            };

            var lblTitle = new Label
            {
                Text = "CONFIRMAR " + _saleType.ToUpper(),
                Font = new Font("Segoe UI", 20f, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42), // slate-900
                Location = new Point(0, 0),
                AutoSize = true
            };

            var lblCust = new Label
            {
                Text = (_customer.name ?? "MOSTRADOR").ToUpper(),
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(2, 132, 199), // cyan/blue-600
                Location = new Point(2, 42),
                AutoSize = true
            };

            var btnClose = new Button
            {
                Text = "✕",
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                BackColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(42, 42),
                Location = new Point(450, 2),
                Cursor = Cursors.Hand
            };
            btnClose.FlatAppearance.BorderColor = Color.FromArgb(226, 232, 240);
            btnClose.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };

            pnlLeftHeader.Controls.Add(lblTitle);
            pnlLeftHeader.Controls.Add(lblCust);
            pnlLeftHeader.Controls.Add(btnClose);

            // Contenedor de Partidas con Scroll
            var pnlItemsContainer = new Panel
            {
                Dock = DockStyle.Fill,
                AutoScroll = true,
                BackColor = Color.Transparent,
                Padding = new Padding(0, 10, 10, 10)
            };

            int itemY = 0;
            foreach (var item in _cart)
            {
                var card = new Panel
                {
                    Location = new Point(0, itemY),
                    Width = 490,
                    Height = 65,
                    BackColor = Color.White,
                    Padding = new Padding(16, 12, 16, 12)
                };
                card.Paint += (s, e) =>
                {
                    using (var p = new Pen(Color.FromArgb(241, 245, 249), 1.5f))
                    {
                        e.Graphics.DrawRectangle(p, 0, 0, card.Width - 1, card.Height - 1);
                    }
                };

                var lblItemName = new Label
                {
                    Text = item.Product.name.ToUpper(),
                    Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(15, 23, 42),
                    Location = new Point(14, 10),
                    Width = 340,
                    AutoEllipsis = true
                };

                var lblItemDetail = new Label
                {
                    Text = string.Format("{0:0.##} X ${1:N2}", item.Quantity, item.UnitPrice),
                    Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(148, 163, 184),
                    Location = new Point(14, 34),
                    AutoSize = true
                };

                var lblItemSubtotal = new Label
                {
                    Text = string.Format("${0:N2}", item.Subtotal),
                    Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(15, 23, 42),
                    Location = new Point(350, 18),
                    Width = 125,
                    TextAlign = ContentAlignment.MiddleRight
                };

                card.Controls.Add(lblItemName);
                card.Controls.Add(lblItemDetail);
                card.Controls.Add(lblItemSubtotal);

                pnlItemsContainer.Controls.Add(card);
                itemY += 73;
            }

            // Tarjeta de Totales (Subtotal, IVA, Total Neto)
            var pnlTotalsCard = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 150,
                BackColor = Color.White,
                Padding = new Padding(22, 16, 22, 16)
            };
            pnlTotalsCard.Paint += (s, e) =>
            {
                using (var p = new Pen(Color.FromArgb(226, 232, 240), 1.5f))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, pnlTotalsCard.Width - 1, pnlTotalsCard.Height - 1);
                }
            };

            decimal subtotal = _total / 1.16m;
            decimal iva = _total - subtotal;

            var lblSubPrompt = new Label { Text = "SUBTOTAL", Font = new Font("Segoe UI", 8f, FontStyle.Bold), ForeColor = Color.FromArgb(148, 163, 184), Location = new Point(22, 16), AutoSize = true };
            var lblSubVal = new Label { Text = string.Format("${0:N2}", subtotal), Font = new Font("Segoe UI", 9f, FontStyle.Bold), ForeColor = Color.FromArgb(100, 116, 139), Location = new Point(340, 14), Size = new Size(130, 20), TextAlign = ContentAlignment.MiddleRight };

            var lblIvaPrompt = new Label { Text = "IVA (16%)", Font = new Font("Segoe UI", 8f, FontStyle.Bold), ForeColor = Color.FromArgb(148, 163, 184), Location = new Point(22, 38), AutoSize = true };
            var lblIvaVal = new Label { Text = string.Format("${0:N2}", iva), Font = new Font("Segoe UI", 9f, FontStyle.Bold), ForeColor = Color.FromArgb(100, 116, 139), Location = new Point(340, 36), Size = new Size(130, 20), TextAlign = ContentAlignment.MiddleRight };

            var pnlDivider = new Panel { Location = new Point(22, 64), Size = new Size(450, 1), BackColor = Color.FromArgb(241, 245, 249) };

            var lblTotalNetoPrompt = new Label { Text = "TOTAL NETO", Font = new Font("Segoe UI", 12f, FontStyle.Bold), ForeColor = Color.FromArgb(2, 132, 199), Location = new Point(22, 85), AutoSize = true };
            var lblTotalNetoVal = new Label { Text = string.Format("${0:N2}", _total), Font = new Font("Segoe UI", 26f, FontStyle.Bold), ForeColor = Color.FromArgb(15, 23, 42), Location = new Point(200, 70), Size = new Size(275, 55), TextAlign = ContentAlignment.MiddleRight };

            pnlTotalsCard.Controls.Add(lblSubPrompt);
            pnlTotalsCard.Controls.Add(lblSubVal);
            pnlTotalsCard.Controls.Add(lblIvaPrompt);
            pnlTotalsCard.Controls.Add(lblIvaVal);
            pnlTotalsCard.Controls.Add(pnlDivider);
            pnlTotalsCard.Controls.Add(lblTotalNetoPrompt);
            pnlTotalsCard.Controls.Add(lblTotalNetoVal);

            pnlLeft.Controls.Add(pnlItemsContainer);
            pnlLeft.Controls.Add(pnlTotalsCard);
            pnlLeft.Controls.Add(pnlLeftHeader);

            // ==============================================================
            // PANEL DERECHO (PAGO / ENVÍO & FINALIZAR) - Ancho ~460px
            // ==============================================================
            var pnlRight = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White,
                Padding = new Padding(35, 30, 35, 30)
            };

            // Switcher de Tabs (PAGO | ENVÍO)
            var pnlTabSwitcher = new Panel
            {
                Dock = DockStyle.Top,
                Height = 55,
                BackColor = Color.FromArgb(248, 250, 252),
                Padding = new Padding(4)
            };
            pnlTabSwitcher.Paint += (s, e) =>
            {
                using (var p = new Pen(Color.FromArgb(241, 245, 249), 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, pnlTabSwitcher.Width - 1, pnlTabSwitcher.Height - 1);
                }
            };

            btnTabPago = new Button
            {
                Text = "PAGO",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Location = new Point(4, 4),
                Size = new Size(185, 47),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnTabPago.FlatAppearance.BorderSize = 0;
            btnTabPago.Click += (s, e) => { activeTab = "payment"; UpdateTabUI(); };

            btnTabEnvio = new Button
            {
                Text = "ENVÍO",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Location = new Point(195, 4),
                Size = new Size(185, 47),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnTabEnvio.FlatAppearance.BorderSize = 0;
            btnTabEnvio.Click += (s, e) => { activeTab = "delivery"; UpdateTabUI(); };

            pnlTabSwitcher.Controls.Add(btnTabPago);
            pnlTabSwitcher.Controls.Add(btnTabEnvio);

            // Contenedor de Métodos de Pago
            pnlTabPaymentContent = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White,
                Padding = new Padding(0, 25, 0, 10)
            };

            btnCaja = CreateModernPaymentButton("🔒  CAJA", "PAGO_EN_CAJA", 0, 25, 185, 115);
            btnContraEntrega = CreateModernPaymentButton("🚚  CONTRA ENTREGA", "CONTRA_ENTREGA", 200, 25, 185, 115);
            btnCredito = CreateModernPaymentButton("🛡️  CRÉDITO", "CREDIT_STORE", 0, 155, 185, 115);

            btnCaja.Click += (s, e) => { SelectedPaymentMethod = "PAGO_EN_CAJA"; UpdatePaymentMethodUI(); };
            btnContraEntrega.Click += (s, e) => { SelectedPaymentMethod = "CONTRA_ENTREGA"; UpdatePaymentMethodUI(); };
            btnCredito.Click += (s, e) => { SelectedPaymentMethod = "CREDIT_STORE"; UpdatePaymentMethodUI(); };

            pnlTabPaymentContent.Controls.Add(btnCaja);
            pnlTabPaymentContent.Controls.Add(btnContraEntrega);
            pnlTabPaymentContent.Controls.Add(btnCredito);

            // Contenedor de Opciones de Envío
            pnlTabDeliveryContent = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White,
                Padding = new Padding(0, 25, 0, 10),
                Visible = false
            };

            btnToggleDelivery = new Button
            {
                Text = "🚚   SOLICITAR ENVÍO / FLETE",
                Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
                Location = new Point(0, 25),
                Size = new Size(385, 60),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnToggleDelivery.Click += (s, e) =>
            {
                IsDelivery = !IsDelivery;
                UpdateDeliveryUI();
            };

            rbCliente = new RadioButton
            {
                Text = "DIRECCIÓN DE CLIENTE",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(10, 100),
                AutoSize = true,
                Checked = true
            };
            rbCliente.CheckedChanged += (s, e) =>
            {
                if (rbCliente.Checked)
                {
                    txtDeliveryAddress.Text = _customer.address ?? "Mostrador";
                }
            };

            rbOtra = new RadioButton
            {
                Text = "OTRA DIRECCIÓN",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(200, 100),
                AutoSize = true
            };
            rbOtra.CheckedChanged += (s, e) =>
            {
                if (rbOtra.Checked)
                {
                    txtDeliveryAddress.Focus();
                    txtDeliveryAddress.SelectAll();
                }
            };

            txtDeliveryAddress = new TextBox
            {
                Multiline = true,
                Font = new Font("Segoe UI", 9.5f),
                Location = new Point(0, 130),
                Size = new Size(385, 120),
                BackColor = Color.FromArgb(248, 250, 252),
                ForeColor = Color.FromArgb(15, 23, 42),
                Text = _customer.address ?? "Mostrador"
            };

            pnlTabDeliveryContent.Controls.Add(btnToggleDelivery);
            pnlTabDeliveryContent.Controls.Add(rbCliente);
            pnlTabDeliveryContent.Controls.Add(rbOtra);
            pnlTabDeliveryContent.Controls.Add(txtDeliveryAddress);

            // Botón Inferior "Finalizar"
            btnFinalizar = new Button
            {
                Text = "Finalizar",
                Font = new Font("Segoe UI", 18f, FontStyle.Bold),
                BackColor = Color.FromArgb(2, 132, 199), // Cyan/Blue vibrante (#0284C7)
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Dock = DockStyle.Bottom,
                Height = 72,
                Cursor = Cursors.Hand
            };
            btnFinalizar.FlatAppearance.BorderSize = 0;
            btnFinalizar.Click += BtnFinalizar_Click;

            pnlRight.Controls.Add(pnlTabPaymentContent);
            pnlRight.Controls.Add(pnlTabDeliveryContent);
            pnlRight.Controls.Add(btnFinalizar);
            pnlRight.Controls.Add(pnlTabSwitcher);

            this.Controls.Add(pnlRight);
            this.Controls.Add(pnlLeft);

            // Atajos de Teclado
            this.KeyPreview = true;
            this.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Escape)
                {
                    this.DialogResult = DialogResult.Cancel;
                    this.Close();
                }
                else if (e.KeyCode == Keys.D1 || e.KeyCode == Keys.NumPad1 || e.KeyCode == Keys.F1)
                {
                    activeTab = "payment";
                    SelectedPaymentMethod = "PAGO_EN_CAJA";
                    UpdateTabUI();
                    UpdatePaymentMethodUI();
                    e.Handled = true;
                }
                else if (e.KeyCode == Keys.D2 || e.KeyCode == Keys.NumPad2 || e.KeyCode == Keys.F2)
                {
                    activeTab = "payment";
                    SelectedPaymentMethod = "CONTRA_ENTREGA";
                    UpdateTabUI();
                    UpdatePaymentMethodUI();
                    e.Handled = true;
                }
                else if (e.KeyCode == Keys.D3 || e.KeyCode == Keys.NumPad3 || e.KeyCode == Keys.F3)
                {
                    activeTab = "payment";
                    SelectedPaymentMethod = "CREDIT_STORE";
                    UpdateTabUI();
                    UpdatePaymentMethodUI();
                    e.Handled = true;
                }
                else if (e.KeyCode == Keys.F8)
                {
                    activeTab = activeTab == "payment" ? "delivery" : "payment";
                    UpdateTabUI();
                    e.Handled = true;
                }
                else if (e.KeyCode == Keys.Enter && !txtDeliveryAddress.Focused)
                {
                    BtnFinalizar_Click(this, EventArgs.Empty);
                    e.Handled = true;
                }
            };
        }

        private Button CreateModernPaymentButton(string text, string tag, int x, int y, int width, int height)
        {
            var btn = new Button
            {
                Text = text,
                Tag = tag,
                Location = new Point(x, y),
                Size = new Size(width, height),
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            return btn;
        }

        private void UpdateTabUI()
        {
            if (activeTab == "payment")
            {
                btnTabPago.BackColor = Color.White;
                btnTabPago.ForeColor = Color.FromArgb(2, 132, 199);
                btnTabPago.FlatAppearance.BorderSize = 1;
                btnTabPago.FlatAppearance.BorderColor = Color.FromArgb(226, 232, 240);

                btnTabEnvio.BackColor = Color.Transparent;
                btnTabEnvio.ForeColor = Color.FromArgb(148, 163, 184);
                btnTabEnvio.FlatAppearance.BorderSize = 0;

                pnlTabPaymentContent.Visible = true;
                pnlTabDeliveryContent.Visible = false;
            }
            else
            {
                btnTabEnvio.BackColor = Color.White;
                btnTabEnvio.ForeColor = Color.FromArgb(2, 132, 199);
                btnTabEnvio.FlatAppearance.BorderSize = 1;
                btnTabEnvio.FlatAppearance.BorderColor = Color.FromArgb(226, 232, 240);

                btnTabPago.BackColor = Color.Transparent;
                btnTabPago.ForeColor = Color.FromArgb(148, 163, 184);
                btnTabPago.FlatAppearance.BorderSize = 0;

                pnlTabPaymentContent.Visible = false;
                pnlTabDeliveryContent.Visible = true;
            }
        }

        private void UpdatePaymentMethodUI()
        {
            ApplyPaymentButtonStyle(btnCaja, SelectedPaymentMethod == "PAGO_EN_CAJA");
            ApplyPaymentButtonStyle(btnContraEntrega, SelectedPaymentMethod == "CONTRA_ENTREGA");
            ApplyPaymentButtonStyle(btnCredito, SelectedPaymentMethod == "CREDIT_STORE");
        }

        private void ApplyPaymentButtonStyle(Button btn, bool isSelected)
        {
            if (isSelected)
            {
                btn.BackColor = Color.FromArgb(11, 19, 43); // Dark/Black #0B132B
                btn.ForeColor = Color.White;
                btn.FlatAppearance.BorderColor = Color.FromArgb(11, 19, 43);
                btn.FlatAppearance.BorderSize = 2;
            }
            else
            {
                btn.BackColor = Color.FromArgb(248, 250, 252);
                btn.ForeColor = Color.FromArgb(100, 116, 139);
                btn.FlatAppearance.BorderColor = Color.FromArgb(241, 245, 249);
                btn.FlatAppearance.BorderSize = 1;
            }
        }

        private void UpdateDeliveryUI()
        {
            if (IsDelivery)
            {
                btnToggleDelivery.BackColor = Color.FromArgb(238, 242, 255); // primary-50
                btnToggleDelivery.ForeColor = Color.FromArgb(2, 132, 199);
                btnToggleDelivery.FlatAppearance.BorderColor = Color.FromArgb(186, 230, 253);
                rbCliente.Enabled = true;
                rbOtra.Enabled = true;
                txtDeliveryAddress.Enabled = true;
            }
            else
            {
                btnToggleDelivery.BackColor = Color.FromArgb(248, 250, 252);
                btnToggleDelivery.ForeColor = Color.FromArgb(148, 163, 184);
                btnToggleDelivery.FlatAppearance.BorderColor = Color.FromArgb(241, 245, 249);
                rbCliente.Enabled = false;
                rbOtra.Enabled = false;
                txtDeliveryAddress.Enabled = false;
            }
        }

        private void BtnFinalizar_Click(object sender, EventArgs e)
        {
            DeliveryAddress = txtDeliveryAddress.Text.Trim();
            this.DialogResult = DialogResult.OK;
            this.Close();
        }
    }
}
