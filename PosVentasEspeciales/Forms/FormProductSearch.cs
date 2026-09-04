using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using PosVentasEspeciales.Models;
using PosVentasEspeciales.Services;

namespace PosVentasEspeciales.Forms
{
    public class FormProductSearch : Form
    {
        private TextBox txtSearch;
        private DataGridView gridProducts;
        private Label lblCount;
        public Product SelectedProduct { get; private set; }
        public decimal QuantityMultiplier { get; set; }
        private Timer searchTimer;

        public FormProductSearch(string initialQuery = "", decimal quantity = 1)
        {
            QuantityMultiplier = quantity > 0 ? quantity : 1;
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
            this.Text = "Búsqueda Rápida de Artículos [F2]";
            this.Size = new Size(850, 520);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252); // slate-50
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Panel Superior
            var pnlTop = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(30, 58, 138), // Navy blue
                Padding = new Padding(20, 15, 20, 15)
            };

            var lblTitle = new Label
            {
                Text = "CATÁLOGO DE PRODUCTOS Y MATERIALES",
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

            // Grid de Productos
            gridProducts = new DataGridView
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

            gridProducts.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(241, 245, 249);
            gridProducts.ColumnHeadersDefaultCellStyle.ForeColor = Color.FromArgb(71, 85, 105);
            gridProducts.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            gridProducts.ColumnHeadersHeight = 35;

            gridProducts.DefaultCellStyle.SelectionBackColor = Color.FromArgb(219, 234, 254);
            gridProducts.DefaultCellStyle.SelectionForeColor = Color.FromArgb(30, 58, 138);

            gridProducts.Columns.Add(new DataGridViewTextBoxColumn { Name = "legacy_code", HeaderText = "Código / SKU", FillWeight = 25 });
            gridProducts.Columns.Add(new DataGridViewTextBoxColumn { Name = "name", HeaderText = "Descripción del Artículo", FillWeight = 55 });
            gridProducts.Columns.Add(new DataGridViewTextBoxColumn { Name = "sale_unit", HeaderText = "Unidad", FillWeight = 15 });
            gridProducts.Columns.Add(new DataGridViewTextBoxColumn { Name = "price_1", HeaderText = "P1 (Público)", FillWeight = 20, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "C2" } });
            gridProducts.Columns.Add(new DataGridViewTextBoxColumn { Name = "price_2", HeaderText = "P2 (Mayoreo)", FillWeight = 20, DefaultCellStyle = { Alignment = DataGridViewContentAlignment.MiddleRight, Format = "C2" } });

            gridProducts.DoubleClick += (s, e) => SelectCurrentItem();
            gridProducts.KeyDown += GridProducts_KeyDown;

            // Panel Inferior
            var pnlBottom = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 45,
                BackColor = Color.FromArgb(241, 245, 249),
                Padding = new Padding(15, 10, 15, 10)
            };

            lblCount = new Label
            {
                Text = "0 productos encontrados",
                ForeColor = Color.FromArgb(100, 116, 139),
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Dock = DockStyle.Left,
                AutoSize = true
            };

            var lblHint = new Label
            {
                Text = "[Enter] Seleccionar | [Esc] Cancelar | [↑/↓] Navegar",
                ForeColor = Color.FromArgb(71, 85, 105),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Italic),
                Dock = DockStyle.Right,
                AutoSize = true
            };

            pnlBottom.Controls.Add(lblCount);
            pnlBottom.Controls.Add(lblHint);

            this.Controls.Add(gridProducts);
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
            };
        }

        private void PerformSearch()
        {
            string q = txtSearch.Text.Trim();
            var results = ApiService.SearchProducts(q);

            gridProducts.Rows.Clear();
            foreach (var p in results)
            {
                int rowIndex = gridProducts.Rows.Add(p.legacy_code ?? p.barcode ?? p.id, p.name, p.sale_unit ?? "PZ", p.Price1Decimal, p.Price2Decimal);
                gridProducts.Rows[rowIndex].Tag = p;
            }

            lblCount.Text = string.Format("{0} producto(s) encontrado(s)", results.Count);

            if (gridProducts.Rows.Count > 0)
            {
                gridProducts.Rows[0].Selected = true;
            }
        }

        private void TxtSearch_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Down && gridProducts.Rows.Count > 0)
            {
                int curIdx = gridProducts.SelectedRows.Count > 0 ? gridProducts.SelectedRows[0].Index : -1;
                if (curIdx < gridProducts.Rows.Count - 1)
                {
                    gridProducts.Rows[curIdx + 1].Selected = true;
                    gridProducts.FirstDisplayedScrollingRowIndex = Math.Max(0, curIdx + 1);
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Up && gridProducts.Rows.Count > 0)
            {
                int curIdx = gridProducts.SelectedRows.Count > 0 ? gridProducts.SelectedRows[0].Index : 0;
                if (curIdx > 0)
                {
                    gridProducts.Rows[curIdx - 1].Selected = true;
                    gridProducts.FirstDisplayedScrollingRowIndex = Math.Max(0, curIdx - 1);
                }
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Enter)
            {
                SelectCurrentItem();
                e.Handled = true;
            }
        }

        private void GridProducts_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                SelectCurrentItem();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Up && gridProducts.SelectedRows.Count > 0 && gridProducts.SelectedRows[0].Index == 0)
            {
                txtSearch.Focus();
                e.Handled = true;
            }
        }

        private void SelectCurrentItem()
        {
            if (gridProducts.SelectedRows.Count > 0)
            {
                SelectedProduct = gridProducts.SelectedRows[0].Tag as Product;
                if (SelectedProduct != null)
                {
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }
            }
        }
    }
}
