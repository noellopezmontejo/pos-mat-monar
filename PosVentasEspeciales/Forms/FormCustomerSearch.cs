using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using PosVentasEspeciales.Models;
using PosVentasEspeciales.Services;

namespace PosVentasEspeciales.Forms
{
    public class FormCustomerSearch : Form
    {
        private TextBox txtSearch;
        private DataGridView gridCustomers;
        private Label lblCount;
        public Customer SelectedCustomer { get; private set; }
        private Timer searchTimer;

        public FormCustomerSearch(string initialQuery = "")
        {
            searchTimer = new Timer();
            searchTimer.Interval = 250;
            searchTimer.Tick += (s, e) =>
            {
                if (searchTimer != null) searchTimer.Stop();
                PerformSearch();
            };

            InitializeComponent();
            txtSearch.Text = initialQuery ?? "";
            txtSearch.SelectionStart = txtSearch.Text.Length;

            PerformSearch();
        }

        private void InitializeComponent()
        {
            this.Text = "Seleccionar / Vincular Cliente [F1]";
            this.Size = new Size(800, 480);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            var pnlTop = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(30, 58, 138),
                Padding = new Padding(20, 15, 20, 15)
            };

            var lblTitle = new Label
            {
                Text = "PADRÓN DE CLIENTES Y CUENTAS",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 11f, FontStyle.Bold),
                Dock = DockStyle.Top,
                Height = 22
            };

            txtSearch = new TextBox
            {
                Dock = DockStyle.Bottom,
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                Height = 35,
                ForeColor = Color.FromArgb(15, 23, 42)
            };
            txtSearch.TextChanged += (s, e) =>
            {
                if (searchTimer != null)
                {
                    searchTimer.Stop();
                    searchTimer.Start();
                }
            };
            txtSearch.KeyDown += TxtSearch_KeyDown;

            pnlTop.Controls.Add(lblTitle);
            pnlTop.Controls.Add(txtSearch);

            gridCustomers = new DataGridView
            {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.None,
                RowHeadersVisible = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                RowTemplate = { Height = 36 },
                EnableHeadersVisualStyles = false
            };

            gridCustomers.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(241, 245, 249);
            gridCustomers.ColumnHeadersDefaultCellStyle.ForeColor = Color.FromArgb(71, 85, 105);
            gridCustomers.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            gridCustomers.ColumnHeadersHeight = 35;

            gridCustomers.DefaultCellStyle.SelectionBackColor = Color.FromArgb(219, 234, 254);
            gridCustomers.DefaultCellStyle.SelectionForeColor = Color.FromArgb(30, 58, 138);

            gridCustomers.Columns.Add(new DataGridViewTextBoxColumn { Name = "code", HeaderText = "Cód. Cliente", FillWeight = 20 });
            gridCustomers.Columns.Add(new DataGridViewTextBoxColumn { Name = "name", HeaderText = "Nombre / Razón Social", FillWeight = 45 });
            gridCustomers.Columns.Add(new DataGridViewTextBoxColumn { Name = "rfc", HeaderText = "RFC", FillWeight = 20 });
            gridCustomers.Columns.Add(new DataGridViewTextBoxColumn { Name = "address", HeaderText = "Dirección", FillWeight = 35 });

            gridCustomers.DoubleClick += (s, e) => SelectCurrentItem();
            gridCustomers.KeyDown += GridCustomers_KeyDown;

            var pnlBottom = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 45,
                BackColor = Color.FromArgb(241, 245, 249),
                Padding = new Padding(15, 10, 15, 10)
            };

            lblCount = new Label
            {
                Text = "0 clientes encontrados",
                ForeColor = Color.FromArgb(100, 116, 139),
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Dock = DockStyle.Left,
                AutoSize = true
            };

            var lblHint = new Label
            {
                Text = "[F1] Mostrador | [Enter] Seleccionar | [Esc] Cancelar",
                ForeColor = Color.FromArgb(71, 85, 105),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Italic),
                Dock = DockStyle.Right,
                AutoSize = true
            };

            pnlBottom.Controls.Add(lblCount);
            pnlBottom.Controls.Add(lblHint);

            this.Controls.Add(gridCustomers);
            this.Controls.Add(pnlBottom);
            this.Controls.Add(pnlTop);

            this.KeyPreview = true;
            this.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Escape)
                {
                    this.DialogResult = DialogResult.Cancel;
                    this.Close();
                }
                else if (e.KeyCode == Keys.F1)
                {
                    SelectedCustomer = Customer.DefaultCustomer;
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }
            };
        }

        private void PerformSearch()
        {
            string q = txtSearch.Text.Trim();
            var results = ApiService.SearchCustomers(q);

            gridCustomers.Rows.Clear();

            // Opción fija: Mostrador
            int defaultRow = gridCustomers.Rows.Add("0000", "PÚBLICO EN GENERAL (MOSTRADOR)", "XAXX010101000", "Venta en Tienda");
            gridCustomers.Rows[defaultRow].Tag = Customer.DefaultCustomer;

            foreach (var c in results)
            {
                string codeDisplay = c.legacy_code;
                if (string.IsNullOrEmpty(codeDisplay))
                {
                    codeDisplay = (c.id != null && c.id.Length >= 6) ? c.id.Substring(0, 6) : (c.id ?? "CTE");
                }
                int rowIndex = gridCustomers.Rows.Add(codeDisplay, c.name, c.RFCDisplay, c.address ?? "Sin dirección");
                gridCustomers.Rows[rowIndex].Tag = c;
            }

            lblCount.Text = string.Format("{0} cliente(s) disponible(s)", results.Count + 1);

            if (gridCustomers.Rows.Count > 0)
            {
                gridCustomers.Rows[0].Selected = true;
            }
        }

        private void TxtSearch_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Down && gridCustomers.Rows.Count > 0)
            {
                int curIdx = gridCustomers.SelectedRows.Count > 0 ? gridCustomers.SelectedRows[0].Index : -1;
                if (curIdx < gridCustomers.Rows.Count - 1)
                {
                    gridCustomers.Rows[curIdx + 1].Selected = true;
                    gridCustomers.FirstDisplayedScrollingRowIndex = Math.Max(0, curIdx + 1);
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Up && gridCustomers.Rows.Count > 0)
            {
                int curIdx = gridCustomers.SelectedRows.Count > 0 ? gridCustomers.SelectedRows[0].Index : 0;
                if (curIdx > 0)
                {
                    gridCustomers.Rows[curIdx - 1].Selected = true;
                    gridCustomers.FirstDisplayedScrollingRowIndex = Math.Max(0, curIdx - 1);
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Enter)
            {
                SelectCurrentItem();
                e.Handled = true;
            }
        }

        private void GridCustomers_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                SelectCurrentItem();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Up && gridCustomers.SelectedRows.Count > 0 && gridCustomers.SelectedRows[0].Index == 0)
            {
                txtSearch.Focus();
                e.Handled = true;
            }
        }

        private void SelectCurrentItem()
        {
            if (gridCustomers.SelectedRows.Count > 0)
            {
                SelectedCustomer = gridCustomers.SelectedRows[0].Tag as Customer;
                if (SelectedCustomer != null)
                {
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }
            }
        }
    }
}
