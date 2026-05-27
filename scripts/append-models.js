const fs = require('fs');
let prisma = fs.readFileSync('prisma/schema.prisma', 'utf8');

const models = `
// SAT Catalogs from User Script
model CColonia {
  Id              Int     @id @default(autoincrement())
  c_Colonia       String? @db.VarChar(20)
  c_CodigoPostal  String? @db.VarChar(20)
  Nombre          String? @db.VarChar(150)

  @@map("c_colonia")
}

model CCp {
  Id              Int     @id @default(autoincrement())
  c_CP            String? @db.VarChar(50)
  c_Estado        String? @db.VarChar(50)
  c_Municipio     String? @db.VarChar(50)
  c_Localidad     String? @db.VarChar(50)

  @@map("c_cp")
}

model CEstado {
  Id              Int     @id @default(autoincrement())
  c_Estado        String? @db.VarChar(50)
  c_Pais          String? @db.VarChar(50)
  Descripcion     String? @db.VarChar(100)

  @@map("c_estado")
}

model CMunicipio {
  Id              Int     @id @default(autoincrement())
  c_Municipio     String? @db.VarChar(50)
  c_Estado        String? @db.VarChar(50)
  Descripcion     String? @db.VarChar(100)

  @@map("c_municipio")
}

model CPais {
  Id              Int     @id @default(autoincrement())
  c_Pais          String? @db.VarChar(50)
  Descripcion     String? @db.VarChar(100)

  @@map("c_pais")
}

model CatFormaPagoSat {
  CveFormaPago    Int     @id @default(autoincrement())
  c_FormaPago     String  @db.VarChar(4)
  Descripcion     String? @db.VarChar(255)
  Bancarizado                     String? @db.VarChar(255)
  NumOperacion                    String? @db.VarChar(255)
  RfcEmisorOrdenante              String? @db.VarChar(255)
  CuentaOrdenante                 String? @db.VarChar(255)
  PatronCuentaOrdenante           String? @map("PatrónCuentaOrdenante") @db.VarChar(255)
  RfcEmisorBeneficiario           String? @db.VarChar(255)
  CuentaBenenficiario             String? @db.VarChar(255)
  PatronCuentaBeneficiaria        String? @map("PatrónCuentaBeneficiaria") @db.VarChar(255)
  TipoCadenaPago                  String? @db.VarChar(255)
  NombreBancoEmisorOrdenanteExtranjero String? @db.VarChar(255)
  InicioVig                       String? @db.VarChar(10)
  FinVig                          String? @db.VarChar(10)

  @@map("catformapagosat")
}

model CatMetodoPagoSat {
  CveMetodoPago   Int     @id @default(autoincrement())
  c_metodopago    String  @db.VarChar(5)
  Descripcion     String? @db.VarChar(100)
  InicioVig       String? @db.VarChar(10)
  FinVig          String? @db.VarChar(10)

  @@map("catmetodopagosat")
}

model CatRegimenSatNuevo {
  CveRegimen      Int     @id @default(autoincrement())
  CveTipoEmisor   Int?
  Regimen         String  @db.VarChar(10)
  Descripcion     String? @db.VarChar(255)
  Fisica          String? @db.VarChar(255)
  Moral           String? @db.VarChar(255)
  InicioVig       String? @db.VarChar(10)
  FinVig          String? @db.VarChar(10)

  @@map("catregimensat")
}

model CatUsoCfdiSatNuevo {
  CveUso          Int     @id @default(autoincrement())
  c_UsoCFDI       String  @db.VarChar(5)
  Descripcion     String? @db.VarChar(255)
  Persona         String? @db.VarChar(2)
  InicioVig       String? @db.VarChar(10)
  FinVig          String? @db.VarChar(10)

  @@map("catusocfdisat")
}
`;

fs.writeFileSync('prisma/schema.prisma', prisma + '\n' + models);
console.log('Appended models!');
