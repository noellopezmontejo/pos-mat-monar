using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using PosVentasEspeciales.Models;
using PosVentasEspeciales.Services;

namespace PosVentasEspeciales.Forms
{
    public class FormPOS : Form
    {
        // Estado de la Venta
        private User currentCashier;
        private string currentSaleType = "REMISSION"; // "REMISSION" o "ANTICIPO"
        private Customer currentCustomer = Customer.DefaultCustomer;
        private List<SaleItem> cart = new List<SaleItem>();

        // Controles de Encabezado
        private Panel pnlHeader;
        private Label lblBrandTitle;
        private Label lblBrandSubtitle;
        private Button btnRemissionType;
        private Button btnAnticipoType;
        private Panel pnlCustomerCard;
        private Label lblCustomerName;
        private Label lblCustomerCode;
        private Button btnChangeCustomer;
        private Panel pnlCashierCard;
        private Label lblCashierName;
        private Button btnSwitchCashier;

        // Controles de Búsqueda Rápida
        private Panel pnlSearch;
        private TextBox txtFastSearch;
        private Button btnSearchModal;

        // Grid Principal
        private DataGridView gridCart;

        // Panel de Totales e Información Inferior
        private Panel pnlBottom;
        private Label lblItemCount;
        private Label lblSubtotalVal;
        private Label lblIvaVal;
        private Label lblTotalVal;
        private Label lblTotalLetras;
        private Button btnCheckout;
        private Panel pnlShortcutsBar;

        public FormPOS(User cashier = null)
        {
            currentCashier = cashier ?? ApiService.CurrentUser ?? User.DefaultUser;
            InitializeCustomComponents();
            UpdateSaleTypeUI();
            UpdateCustomerUI();
            UpdateCashierUI();
            RecalculateTotals();
        }

        private void InitializeCustomComponents()
        {
            this.Text = "Materiales Monar - Punto de Venta Especial [.NET 4.0]";
            this.Size = new Size(1200, 760);
            this.MinimumSize = new Size(1000, 650);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.WindowState = FormWindowState.Maximized;
            this.BackColor = Color.FromArgb(241, 245, 249); // slate-100
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // ==========================================
            // 1. ENCABEZADO PREMIUM
            // ==========================================
            pnlHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(15, 23, 42), // slate-900
                Padding = new Padding(20, 10, 20, 10)
            };

            // Branding Izquierda
            var pnlBrand = new Panel { Dock = DockStyle.Left, Width = 260, BackColor = Color.Transparent };
            lblBrandTitle = new Label
            {
                Text = "MATERIALES MONAR",
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(0, 8),
                AutoSize = true
            };
            lblBrandSubtitle = new Label
            {
                Text = "VENTAS ESPECIALES & MOSTRADOR",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184), // slate-400
                Location = new Point(0, 36),
                AutoSize = true
            };
            pnlBrand.Controls.Add(lblBrandTitle);
            pnlBrand.Controls.Add(lblBrandSubtitle);

            // Selector Tipo de Venta (Centro)
            var pnlTypeSelector = new Panel { Dock = DockStyle.Left, Width = 310, BackColor = Color.Transparent };
            btnRemissionType = new Button
            {
                Text = "REMISIÓN (F3)",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Size = new Size(145, 45),
                Location = new Point(5, 10),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnRemissionType.Click += (s, e) => SetSaleType("REMISSION");

            btnAnticipoType = new Button
            {
                Text = "ANTICIPO (F3)",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Size = new Size(145, 45),
                Location = new Point(155, 10),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnAnticipoType.Click += (s, e) => SetSaleType("ANTICIPO");

            pnlTypeSelector.Controls.Add(btnRemissionType);
            pnlTypeSelector.Controls.Add(btnAnticipoType);

            // Tarjeta de Cliente (Derecha)
            pnlCustomerCard = new Panel
            {
                Dock = DockStyle.Right,
                Width = 340,
                BackColor = Color.FromArgb(30, 41, 59), // slate-800
                Padding = new Padding(12, 8, 12, 8)
            };

            lblCustomerName = new Label
            {
                Text = "PÚBLICO EN GENERAL",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(12, 10),
                Width = 210,
                AutoEllipsis = true
            };

            lblCustomerCode = new Label
            {
                Text = "CLIENTE: MOSTRADOR (0000)",
                Font = new Font("Segoe UI", 8f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(12, 35),
                AutoSize = true
            };

            btnChangeCustomer = new Button
            {
                Text = "CLIENTE [F1]",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                Size = new Size(95, 40),
                Location = new Point(232, 12),
                BackColor = Color.FromArgb(37, 99, 235), // blue-600
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnChangeCustomer.FlatAppearance.BorderSize = 0;
            btnChangeCustomer.Click += (s, e) => OpenCustomerSearch();

            pnlCustomerCard.Controls.Add(lblCustomerName);
            pnlCustomerCard.Controls.Add(lblCustomerCode);
            pnlCustomerCard.Controls.Add(btnChangeCustomer);

            // Tarjeta de Cajero (Centro-Derecha)
            pnlCashierCard = new Panel
            {
                Dock = DockStyle.Right,
                Width = 210,
                BackColor = Color.FromArgb(15, 23, 42),
                Padding = new Padding(10, 8, 10, 8)
            };

            lblCashierName = new Label
            {
                Text = "CAJERO: " + (currentCashier != null ? currentCashier.name : "ADMIN"),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(52, 211, 153), // emerald-400
                Location = new Point(6, 10),
                Width = 195,
                AutoEllipsis = true
            };

            btnSwitchCashier = new Button
            {
                Text = "CAMBIAR [Ctrl+L]",
                Font = new Font("Segoe UI", 7.5f, FontStyle.Bold),
                Size = new Size(120, 26),
                Location = new Point(6, 36),
                BackColor = Color.FromArgb(51, 65, 85), // slate-700
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnSwitchCashier.FlatAppearance.BorderSize = 0;
            btnSwitchCashier.Click += (s, e) => SwitchCashier();

            pnlCashierCard.Controls.Add(lblCashierName);
            pnlCashierCard.Controls.Add(btnSwitchCashier);

            pnlHeader.Controls.Add(pnlTypeSelector);
            pnlHeader.Controls.Add(pnlBrand);
            pnlHeader.Controls.Add(pnlCashierCard);
            pnlHeader.Controls.Add(pnlCustomerCard);

            // ==========================================
            // 2. BARRA DE BÚSQUEDA RÁPIDA / CÓDIGO DIRECTO
            // ==========================================
            pnlSearch = new Panel
            {
                Dock = DockStyle.Top,
                Height = 65,
                BackColor = Color.White,
                Padding = new Padding(20, 12, 20, 12)
            };

            var lblSearchPrompt = new Label
            {
                Text = "Captura Rápida / Código:",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                Dock = DockStyle.Left,
                Width = 190,
                TextAlign = ContentAlignment.MiddleLeft
            };

            txtFastSearch = new TextBox
            {
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                Dock = DockStyle.Fill,
                ForeColor = Color.FromArgb(15, 23, 42)
            };
            txtFastSearch.KeyDown += TxtFastSearch_KeyDown;

            btnSearchModal = new Button
            {
                Text = "BUSCAR CATÁLOGO [F2]",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Dock = DockStyle.Right,
                Width = 200,
                BackColor = Color.FromArgb(241, 245, 249),
                ForeColor = Color.FromArgb(30, 58, 138),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnSearchModal.FlatAppearance.BorderColor = Color.FromArgb(203, 213, 225);
            btnSearchModal.Click += (s, e) => OpenProductSearch("");

            pnlSearch.Controls.Add(txtFastSearch);
            pnlSearch.Controls.Add(lblSearchPrompt);
            pnlSearch.Controls.Add(btnSearchModal);

            // ==========================================
            // 3. GRID CENTRAL DE PARTIDAS
            // ==========================================
            gridCart = new DataGridView
            {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.FromArgb(248, 250, 252),
                BorderStyle = BorderStyle.None,
                RowHeadersVisible = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                SelectionMode = DataGridViewSelectionMode.CellSelect,
                MultiSelect = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                RowTemplate = { Height = 40 },
                EnableHeadersVisualStyles = false,
                Font = new Font("Segoe UI", 10f)
            };

            gridCart.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(30, 58, 138); // Navy
            gridCart.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            gridCart.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            gridCart.ColumnHeadersHeight = 38;

            gridCart.DefaultCellStyle.SelectionBackColor = Color.FromArgb(219, 234, 254);
            gridCart.DefaultCellStyle.SelectionForeColor = Color.FromArgb(15, 23, 42);

            // Columnas
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "item_no", HeaderText = "#", FillWeight = 6, ReadOnly = true, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleCenter } });
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "code", HeaderText = "Código / SKU", FillWeight = 16, ReadOnly = true });
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "name", HeaderText = "Descripción del Producto", FillWeight = 38, ReadOnly = true });
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "unit", HeaderText = "Unidad", FillWeight = 10, ReadOnly = true, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleCenter } });
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "qty", HeaderText = "Cantidad", FillWeight = 12, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 10.5f, FontStyle.Bold) } });

            // Columna de Selección de Precio (ComboBox editable en celda)
            var colPriceCombo = new DataGridViewComboBoxColumn
            {
                Name = "price_level",
                HeaderText = "Lista de Precios (P1 a P6)",
                FillWeight = 26,
                FlatStyle = FlatStyle.Flat
            };
            gridCart.Columns.Add(colPriceCombo);

            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "unit_price", HeaderText = "P. Unitario", FillWeight = 14, ReadOnly = true, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "C2", Font = new Font("Segoe UI", 10f, FontStyle.Bold) } });
            gridCart.Columns.Add(new DataGridViewTextBoxColumn { Name = "subtotal", HeaderText = "Importe ($)", FillWeight = 16, ReadOnly = true, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "C2", Font = new Font("Segoe UI", 10.5f, FontStyle.Bold), ForeColor = Color.FromArgb(30, 58, 138) } });

            var colDelete = new DataGridViewButtonColumn
            {
                Name = "action_delete",
                HeaderText = "",
                Text = "X",
                UseColumnTextForButtonValue = true,
                FillWeight = 6,
                FlatStyle = FlatStyle.Flat
            };
            gridCart.Columns.Add(colDelete);

            gridCart.CellValueChanged += GridCart_CellValueChanged;
            gridCart.CellContentClick += GridCart_CellContentClick;
            gridCart.KeyDown += GridCart_KeyDown;

            // ==========================================
            // 4. PANEL INFERIOR DE TOTALES Y BOTONES
            // ==========================================
            pnlBottom = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 160,
                BackColor = Color.White,
                Padding = new Padding(20, 10, 20, 10)
            };

            // Métricas e Importe con Letra (Izquierda)
            var pnlLeftBottom = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.Transparent,
                Padding = new Padding(0, 5, 20, 0)
            };

            lblItemCount = new Label
            {
                Text = "Partidas: 0 | Piezas Totales: 0",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(0, 8),
                AutoSize = true
            };

            lblTotalLetras = new Label
            {
                Text = "(CERO PESOS 00/100 M.N.)",
                Font = new Font("Segoe UI", 9f, FontStyle.Italic),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(0, 36),
                Size = new Size(500, 38)
            };

            pnlLeftBottom.Controls.Add(lblItemCount);
            pnlLeftBottom.Controls.Add(lblTotalLetras);

            // Resumen Financiero y Botón Cobrar (Derecha)
            var pnlRightBottom = new Panel
            {
                Dock = DockStyle.Right,
                Width = 520,
                BackColor = Color.Transparent
            };

            var pnlSubtotals = new Panel
            {
                Location = new Point(0, 0),
                Width = 240,
                Height = 85,
                BackColor = Color.Transparent
            };

            var lblSub = new Label { Text = "Subtotal:", Font = new Font("Segoe UI", 9f), ForeColor = Color.FromArgb(100, 116, 139), Location = new Point(0, 5), AutoSize = true };
            lblSubtotalVal = new Label { Text = "$0.00", Font = new Font("Segoe UI", 9.5f, FontStyle.Bold), ForeColor = Color.FromArgb(15, 23, 42), Location = new Point(110, 5), Size = new Size(120, 20), TextAlign = ContentAlignment.MiddleRight };

            var lblIvaText = new Label { Text = "IVA (16%):", Font = new Font("Segoe UI", 9f), ForeColor = Color.FromArgb(100, 116, 139), Location = new Point(0, 28), AutoSize = true };
            lblIvaVal = new Label { Text = "$0.00", Font = new Font("Segoe UI", 9.5f, FontStyle.Bold), ForeColor = Color.FromArgb(15, 23, 42), Location = new Point(110, 28), Size = new Size(120, 20), TextAlign = ContentAlignment.MiddleRight };

            pnlSubtotals.Controls.Add(lblSub);
            pnlSubtotals.Controls.Add(lblSubtotalVal);
            pnlSubtotals.Controls.Add(lblIvaText);
            pnlSubtotals.Controls.Add(lblIvaVal);

            var pnlGrandTotal = new Panel
            {
                Location = new Point(245, 0),
                Width = 270,
                Height = 85,
                BackColor = Color.FromArgb(248, 250, 252),
                BorderStyle = BorderStyle.FixedSingle,
                Padding = new Padding(10)
            };

            var lblTotalPrompt = new Label { Text = "TOTAL NETO:", Font = new Font("Segoe UI", 9f, FontStyle.Bold), ForeColor = Color.FromArgb(71, 85, 105), Dock = DockStyle.Top };
            lblTotalVal = new Label { Text = "$0.00", Font = new Font("Segoe UI", 20f, FontStyle.Bold), ForeColor = Color.FromArgb(16, 185, 129), Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleRight };

            pnlGrandTotal.Controls.Add(lblTotalVal);
            pnlGrandTotal.Controls.Add(lblTotalPrompt);

            btnCheckout = new Button
            {
                Text = "COBRAR / PROCESAR VENTA [F12]",
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                BackColor = Color.FromArgb(37, 99, 235), // Blue-600
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(0, 92),
                Size = new Size(515, 52),
                Cursor = Cursors.Hand
            };
            btnCheckout.FlatAppearance.BorderSize = 0;
            btnCheckout.Click += (s, e) => ProcessCheckout();

            pnlRightBottom.Controls.Add(pnlSubtotals);
            pnlRightBottom.Controls.Add(pnlGrandTotal);
            pnlRightBottom.Controls.Add(btnCheckout);

            // Barra de Atajos (Fila Inferior)
            pnlShortcutsBar = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 28,
                BackColor = Color.FromArgb(241, 245, 249),
                Padding = new Padding(10, 4, 10, 4)
            };

            var lblShortcuts = new Label
            {
                Text = "[F1/Ctrl+C] Cliente | [F2/Ins] Buscar | [F3] Remisión/Anticipo | [1-6/F4] Precios P1-P6 | [+]/[-] Cantidad | [F6] Cantidad | [Supr] Borrar | [F5] Nueva | [F12/Ctrl+Enter] Cobrar",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(71, 85, 105),
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleCenter
            };
            pnlShortcutsBar.Controls.Add(lblShortcuts);

            pnlBottom.Controls.Add(pnlLeftBottom);
            pnlBottom.Controls.Add(pnlRightBottom);

            // Agregar Paneles al Formulario
            this.Controls.Add(gridCart);
            this.Controls.Add(pnlBottom);
            this.Controls.Add(pnlShortcutsBar);
            this.Controls.Add(pnlSearch);
            this.Controls.Add(pnlHeader);

            // Foco inicial
            this.Shown += (s, e) => { txtFastSearch.Focus(); txtFastSearch.SelectAll(); };

            // Manejador Global de Teclas F1-F12
            this.KeyPreview = true;
            this.KeyDown += FormPOS_KeyDown;
        }

        // ==========================================
        // LÓGICA DE NEGOCIO & INTERACCIÓN
        // ==========================================

        private void SetSaleType(string type)
        {
            currentSaleType = type;
            UpdateSaleTypeUI();
        }

        private void UpdateSaleTypeUI()
        {
            if (currentSaleType == "REMISSION")
            {
                btnRemissionType.BackColor = Color.FromArgb(234, 88, 12); // Orange-600
                btnRemissionType.ForeColor = Color.White;
                btnRemissionType.FlatAppearance.BorderSize = 0;

                btnAnticipoType.BackColor = Color.FromArgb(30, 41, 59);
                btnAnticipoType.ForeColor = Color.FromArgb(148, 163, 184);
                btnAnticipoType.FlatAppearance.BorderSize = 0;
            }
            else
            {
                btnAnticipoType.BackColor = Color.FromArgb(126, 34, 206); // Purple-700
                btnAnticipoType.ForeColor = Color.White;
                btnAnticipoType.FlatAppearance.BorderSize = 0;

                btnRemissionType.BackColor = Color.FromArgb(30, 41, 59);
                btnRemissionType.ForeColor = Color.FromArgb(148, 163, 184);
                btnRemissionType.FlatAppearance.BorderSize = 0;
            }
        }

        private void UpdateCustomerUI()
        {
            lblCustomerName.Text = currentCustomer.name;
            lblCustomerCode.Text = string.Format("CLIENTE: {0} ({1})", currentCustomer.name, currentCustomer.legacy_code ?? "0000");
        }

        private void UpdateCashierUI()
        {
            if (lblCashierName != null)
            {
                lblCashierName.Text = "👤 " + (currentCashier != null ? currentCashier.name : "ADMIN");
            }
        }

        public void SwitchCashier()
        {
            using (var login = new FormLogin())
            {
                if (login.ShowDialog(this) == DialogResult.OK && login.AuthenticatedUser != null)
                {
                    currentCashier = login.AuthenticatedUser;
                    UpdateCashierUI();
                    MessageBox.Show(string.Format("Sesión activa cambiada a: {0} ({1})", currentCashier.name, currentCashier.role ?? "CAJERO"), "Cambio de Cajero", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            txtFastSearch.Focus();
            txtFastSearch.SelectAll();
        }

        private void OpenCustomerSearch()
        {
            using (var form = new FormCustomerSearch())
            {
                if (form.ShowDialog(this) == DialogResult.OK && form.SelectedCustomer != null)
                {
                    currentCustomer = form.SelectedCustomer;
                    UpdateCustomerUI();
                }
            }
            txtFastSearch.Focus();
            txtFastSearch.SelectAll();
        }

        private void OpenProductSearch(string initialQuery, decimal quantity = 1)
        {
            using (var form = new FormProductSearch(initialQuery, quantity))
            {
                if (form.ShowDialog(this) == DialogResult.OK && form.SelectedProduct != null)
                {
                    AddProductToCart(form.SelectedProduct, form.QuantityMultiplier);
                    txtFastSearch.Clear();
                }
            }
            txtFastSearch.Focus();
            txtFastSearch.SelectAll();
        }

        private void TxtFastSearch_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                string rawInput = txtFastSearch.Text.Trim();
                if (!string.IsNullOrEmpty(rawInput))
                {
                    decimal qtyMultiplier = 1;
                    string query = rawInput;

                    // Soporte para sintaxis 5*CODIGO o 10*
                    int starIdx = rawInput.IndexOf('*');
                    if (starIdx > 0)
                    {
                        string qtyPart = rawInput.Substring(0, starIdx).Trim();
                        decimal parsedQty;
                        if (decimal.TryParse(qtyPart, out parsedQty) && parsedQty > 0)
                        {
                            qtyMultiplier = parsedQty;
                            query = rawInput.Substring(starIdx + 1).Trim();
                        }
                    }

                    if (!string.IsNullOrEmpty(query))
                    {
                        var results = ApiService.SearchProducts(query);
                        if (results.Count == 1)
                        {
                            AddProductToCart(results[0], qtyMultiplier);
                            txtFastSearch.Clear();
                        }
                        else
                        {
                            OpenProductSearch(query, qtyMultiplier);
                        }
                    }
                    else
                    {
                        OpenProductSearch("", qtyMultiplier);
                    }
                }
                else
                {
                    OpenProductSearch("", 1);
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Down && gridCart.Rows.Count > 0)
            {
                gridCart.Focus();
                if (gridCart.Rows.Count > 0)
                {
                    gridCart.CurrentCell = gridCart.Rows[0].Cells["qty"];
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Escape)
            {
                txtFastSearch.Clear();
                e.Handled = true;
            }
        }

        public void AddProductToCart(Product product, decimal quantity = 1)
        {
            if (quantity <= 0) quantity = 1;

            var existing = cart.Find(i => i.Product.id == product.id);
            if (existing != null)
            {
                existing.Quantity += quantity;
                RefreshGridRow(existing);
            }
            else
            {
                var item = new SaleItem(product, quantity, 1);
                cart.Add(item);
                AddGridRow(item);
            }

            RecalculateTotals();
            txtFastSearch.Focus();
            txtFastSearch.SelectAll();
        }

        private void AddGridRow(SaleItem item)
        {
            int rowIdx = gridCart.Rows.Add();
            var row = gridCart.Rows[rowIdx];
            row.Tag = item;

            row.Cells["item_no"].Value = cart.Count;
            row.Cells["code"].Value = item.Product.legacy_code ?? item.Product.barcode ?? item.Product.id;
            row.Cells["name"].Value = item.Product.name;
            row.Cells["unit"].Value = item.Product.sale_unit ?? "PZ";
            row.Cells["qty"].Value = item.Quantity;

            // Configurar ComboBox de Precios (P1 a P6)
            var comboCell = (DataGridViewComboBoxCell)row.Cells["price_level"];
            comboCell.Items.Clear();
            var priceOptions = item.Product.GetPriceOptions();
            foreach (var opt in priceOptions)
            {
                comboCell.Items.Add(opt.DisplayText);
            }
            comboCell.Value = priceOptions[0].DisplayText; // P1 por default

            row.Cells["unit_price"].Value = item.UnitPrice;
            row.Cells["subtotal"].Value = item.Subtotal;
        }

        private void RefreshGridRow(SaleItem item)
        {
            foreach (DataGridViewRow row in gridCart.Rows)
            {
                if (row.Tag == item)
                {
                    row.Cells["qty"].Value = item.Quantity;
                    row.Cells["unit_price"].Value = item.UnitPrice;
                    row.Cells["subtotal"].Value = item.Subtotal;
                    break;
                }
            }
        }

        public void SetRowPriceLevel(int rowIndex, int level)
        {
            if (rowIndex < 0 || rowIndex >= gridCart.Rows.Count) return;
            var item = gridCart.Rows[rowIndex].Tag as SaleItem;
            if (item == null || level < 1 || level > 6) return;

            var options = item.Product.GetPriceOptions();
            var opt = options.Find(o => o.Level == level);
            if (opt != null)
            {
                item.SetPriceLevel(level);
                gridCart.Rows[rowIndex].Cells["price_level"].Value = opt.DisplayText;
                gridCart.Rows[rowIndex].Cells["unit_price"].Value = item.UnitPrice;
                gridCart.Rows[rowIndex].Cells["subtotal"].Value = item.Subtotal;
                RecalculateTotals();
            }
        }

        public void AdjustRowQuantity(int rowIndex, decimal delta)
        {
            if (rowIndex < 0 || rowIndex >= gridCart.Rows.Count) return;
            var item = gridCart.Rows[rowIndex].Tag as SaleItem;
            if (item == null) return;

            decimal newQty = item.Quantity + delta;
            if (newQty > 0)
            {
                item.Quantity = newQty;
                gridCart.Rows[rowIndex].Cells["qty"].Value = item.Quantity;
                gridCart.Rows[rowIndex].Cells["subtotal"].Value = item.Subtotal;
                RecalculateTotals();
            }
        }

        private void GridCart_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || e.RowIndex >= gridCart.Rows.Count) return;

            var row = gridCart.Rows[e.RowIndex];
            var item = row.Tag as SaleItem;
            if (item == null) return;

            string colName = gridCart.Columns[e.ColumnIndex].Name;

            if (colName == "qty")
            {
                decimal newQty;
                if (decimal.TryParse(Convert.ToString(row.Cells["qty"].Value), out newQty) && newQty > 0)
                {
                    item.Quantity = newQty;
                }
                else
                {
                    row.Cells["qty"].Value = item.Quantity;
                }
                row.Cells["subtotal"].Value = item.Subtotal;
                RecalculateTotals();
            }
            else if (colName == "price_level")
            {
                string selectedDisplay = Convert.ToString(row.Cells["price_level"].Value);
                if (!string.IsNullOrEmpty(selectedDisplay) && selectedDisplay.Length >= 2 && selectedDisplay[0] == 'P')
                {
                    int level = selectedDisplay[1] - '0';
                    if (level >= 1 && level <= 6)
                    {
                        item.SetPriceLevel(level);
                        row.Cells["unit_price"].Value = item.UnitPrice;
                        row.Cells["subtotal"].Value = item.Subtotal;
                        RecalculateTotals();
                    }
                }
            }
        }

        private void GridCart_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;

            if (gridCart.Columns[e.ColumnIndex].Name == "action_delete")
            {
                var item = gridCart.Rows[e.RowIndex].Tag as SaleItem;
                if (item != null)
                {
                    cart.Remove(item);
                    gridCart.Rows.RemoveAt(e.RowIndex);
                    ReindexGrid();
                    RecalculateTotals();
                }
            }
        }

        private void GridCart_KeyDown(object sender, KeyEventArgs e)
        {
            int rowIndex = gridCart.SelectedCells.Count > 0 ? gridCart.SelectedCells[0].RowIndex : 
                           (gridCart.SelectedRows.Count > 0 ? gridCart.SelectedRows[0].Index : -1);

            if (rowIndex >= 0 && rowIndex < gridCart.Rows.Count)
            {
                // Teclas + y - para modificar cantidad rápidamente
                if (e.KeyCode == Keys.Add || e.KeyCode == Keys.Oemplus)
                {
                    AdjustRowQuantity(rowIndex, 1);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.Subtract || e.KeyCode == Keys.OemMinus)
                {
                    AdjustRowQuantity(rowIndex, -1);
                    e.Handled = true;
                    return;
                }
                // Teclas 1 a 6 para cambiar nivel de precio directamente
                else if (e.KeyCode == Keys.D1 || e.KeyCode == Keys.NumPad1)
                {
                    SetRowPriceLevel(rowIndex, 1);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.D2 || e.KeyCode == Keys.NumPad2)
                {
                    SetRowPriceLevel(rowIndex, 2);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.D3 || e.KeyCode == Keys.NumPad3)
                {
                    SetRowPriceLevel(rowIndex, 3);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.D4 || e.KeyCode == Keys.NumPad4)
                {
                    SetRowPriceLevel(rowIndex, 4);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.D5 || e.KeyCode == Keys.NumPad5)
                {
                    SetRowPriceLevel(rowIndex, 5);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.D6 || e.KeyCode == Keys.NumPad6)
                {
                    SetRowPriceLevel(rowIndex, 6);
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.Delete)
                {
                    var item = gridCart.Rows[rowIndex].Tag as SaleItem;
                    if (item != null)
                    {
                        cart.Remove(item);
                        gridCart.Rows.RemoveAt(rowIndex);
                        ReindexGrid();
                        RecalculateTotals();
                        e.Handled = true;
                    }
                    return;
                }
                else if (e.KeyCode == Keys.F4)
                {
                    var item = gridCart.Rows[rowIndex].Tag as SaleItem;
                    if (item != null)
                    {
                        var options = item.Product.GetPriceOptions();
                        int nextIdx = (item.PriceLevel % options.Count);
                        var nextOpt = options[nextIdx];
                        SetRowPriceLevel(rowIndex, nextOpt.Level);
                        e.Handled = true;
                    }
                    return;
                }
                else if (e.KeyCode == Keys.Up && rowIndex == 0)
                {
                    txtFastSearch.Focus();
                    txtFastSearch.SelectAll();
                    e.Handled = true;
                    return;
                }
                else if (e.KeyCode == Keys.Escape)
                {
                    txtFastSearch.Focus();
                    txtFastSearch.SelectAll();
                    e.Handled = true;
                    return;
                }
            }
        }

        private void ReindexGrid()
        {
            for (int i = 0; i < gridCart.Rows.Count; i++)
            {
                gridCart.Rows[i].Cells["item_no"].Value = i + 1;
            }
        }

        private void RecalculateTotals()
        {
            decimal total = 0;
            decimal totalPieces = 0;

            foreach (var item in cart)
            {
                total += item.Subtotal;
                totalPieces += item.Quantity;
            }

            decimal subtotal = total / 1.16m;
            decimal iva = total - subtotal;

            lblItemCount.Text = string.Format("Partidas: {0} | Piezas Totales: {1:0.##}", cart.Count, totalPieces);
            lblSubtotalVal.Text = string.Format("${0:N2}", subtotal);
            lblIvaVal.Text = string.Format("${0:N2}", iva);
            lblTotalVal.Text = string.Format("${0:N2}", total);
            lblTotalLetras.Text = NumberToWords.ConvertToSpanishWords(total);

            btnCheckout.Enabled = cart.Count > 0;
        }

        private void ProcessCheckout()
        {
            if (cart.Count == 0)
            {
                MessageBox.Show("El carrito de venta está vacío.", "Atención", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            decimal total = 0;
            foreach (var item in cart) total += item.Subtotal;

            using (var checkoutForm = new FormCheckout(cart, total, currentSaleType == "REMISSION" ? "Remisión" : "Anticipo", currentCustomer))
            {
                if (checkoutForm.ShowDialog(this) == DialogResult.OK)
                {
                    // Crear payload para enviar al API
                    var request = new SaleRequest
                    {
                        customer_id = currentCustomer.id,
                        type = currentSaleType,
                        payment_method = checkoutForm.SelectedPaymentMethod,
                        is_delivery = checkoutForm.IsDelivery,
                        delivery_address = checkoutForm.DeliveryAddress
                    };

                    foreach (var item in cart)
                    {
                        request.items.Add(new SaleRequestItem
                        {
                            product_id = item.Product.id,
                            quantity = item.Quantity,
                            price = item.Product.GetPriceCentsByLevel(item.PriceLevel),
                            unit = item.Product.sale_unit ?? "PZ"
                        });
                    }

                    try
                    {
                        var response = ApiService.CreateSale(request);

                        MessageBox.Show(
                            string.Format("¡Venta registrada con éxito en el servidor!\n\nFolio: {0}\nTipo: {1}\nTotal: ${2:N2}\nMétodo: {3}", 
                                response.folio, response.type, total, checkoutForm.SelectedPaymentMethod),
                            "Venta Finalizada",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        // Limpiar carrito para siguiente venta
                        cart.Clear();
                        gridCart.Rows.Clear();
                        currentCustomer = Customer.DefaultCustomer;
                        UpdateCustomerUI();
                        RecalculateTotals();
                        txtFastSearch.Focus();
                        txtFastSearch.SelectAll();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("No se pudo registrar la venta en el servidor:\n\n" + ex.Message, "Error al Guardar Venta", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
        }

        private void FormPOS_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F1 || (e.Control && e.KeyCode == Keys.C))
            {
                OpenCustomerSearch();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F2 || e.KeyCode == Keys.Insert || (e.Control && e.KeyCode == Keys.B))
            {
                OpenProductSearch("", 1);
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F3)
            {
                SetSaleType(currentSaleType == "REMISSION" ? "ANTICIPO" : "REMISSION");
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F4)
            {
                if (gridCart.Rows.Count > 0)
                {
                    int rowIndex = gridCart.SelectedCells.Count > 0 ? gridCart.SelectedCells[0].RowIndex : 
                                   (gridCart.SelectedRows.Count > 0 ? gridCart.SelectedRows[0].Index : 0);
                    var item = gridCart.Rows[rowIndex].Tag as SaleItem;
                    if (item != null)
                    {
                        var options = item.Product.GetPriceOptions();
                        int nextIdx = (item.PriceLevel % options.Count);
                        var nextOpt = options[nextIdx];
                        SetRowPriceLevel(rowIndex, nextOpt.Level);
                    }
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F5 || (e.Control && e.KeyCode == Keys.N))
            {
                if (cart.Count > 0 && MessageBox.Show("¿Deseas limpiar la venta actual y comenzar una nueva?", "Nueva Venta", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                {
                    cart.Clear();
                    gridCart.Rows.Clear();
                    currentCustomer = Customer.DefaultCustomer;
                    UpdateCustomerUI();
                    RecalculateTotals();
                }
                txtFastSearch.Focus();
                txtFastSearch.SelectAll();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F6 || (e.Control && e.KeyCode == Keys.Q))
            {
                if (gridCart.Rows.Count > 0)
                {
                    int rowIndex = gridCart.SelectedCells.Count > 0 ? gridCart.SelectedCells[0].RowIndex : 
                                   (gridCart.SelectedRows.Count > 0 ? gridCart.SelectedRows[0].Index : 0);
                    gridCart.Focus();
                    gridCart.CurrentCell = gridCart.Rows[rowIndex].Cells["qty"];
                    gridCart.BeginEdit(true);
                }
                e.Handled = true;
            }
            else if ((e.Control && e.KeyCode == Keys.L) || e.KeyCode == Keys.F9)
            {
                SwitchCashier();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F12 || (e.Control && e.KeyCode == Keys.Enter))
            {
                if (cart.Count > 0)
                {
                    ProcessCheckout();
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Escape && !txtFastSearch.Focused)
            {
                txtFastSearch.Focus();
                txtFastSearch.SelectAll();
                e.Handled = true;
            }
        }
    }
}
