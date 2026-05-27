const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const regimes = [
  { code: '601', description: 'General de Ley Personas Morales', applies_to: 'MORAL' },
  { code: '603', description: 'Personas Morales con Fines no Lucrativos', applies_to: 'MORAL' },
  { code: '605', description: 'Sueldos y Salarios e Ingresos Asimilados a Salarios', applies_to: 'FISICA' },
  { code: '606', description: 'Arrendamiento', applies_to: 'FISICA' },
  { code: '607', description: 'Régimen de Enajenación o Adquisición de Bienes', applies_to: 'FISICA' },
  { code: '608', description: 'Demás ingresos', applies_to: 'FISICA' },
  { code: '610', description: 'Residentes en el Extranjero sin Establecimiento Permanente en México', applies_to: 'ALL' },
  { code: '611', description: 'Ingresos por Dividendos (socios y accionistas)', applies_to: 'FISICA' },
  { code: '612', description: 'Personas Físicas con Actividades Empresariales y Profesionales', applies_to: 'FISICA' },
  { code: '614', description: 'Ingresos por intereses', applies_to: 'FISICA' },
  { code: '615', description: 'Régimen de los ingresos por obtención de premios', applies_to: 'FISICA' },
  { code: '616', description: 'Sin obligaciones fiscales', applies_to: 'FISICA' },
  { code: '620', description: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', applies_to: 'MORAL' },
  { code: '621', description: 'Incorporación Fiscal', applies_to: 'FISICA' },
  { code: '622', description: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (AGAPES)', applies_to: 'MORAL' },
  { code: '623', description: 'Opcional para Grupos de Sociedades', applies_to: 'MORAL' },
  { code: '624', description: 'Coordinados', applies_to: 'MORAL' },
  { code: '625', description: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', applies_to: 'FISICA' },
  { code: '626', description: 'Régimen Simplificado de Confianza (RESICO)', applies_to: 'ALL' }
];

const cfdiUses = [
  { code: 'G01', description: 'Adquisición de mercancias', applies_to: 'ALL' },
  { code: 'G02', description: 'Devoluciones, descuentos o bonificaciones', applies_to: 'ALL' },
  { code: 'G03', description: 'Gastos en general', applies_to: 'ALL' },
  { code: 'I01', description: 'Construcciones', applies_to: 'ALL' },
  { code: 'I02', description: 'Mobilario y equipo de oficina por inversiones', applies_to: 'ALL' },
  { code: 'I03', description: 'Equipo de transporte', applies_to: 'ALL' },
  { code: 'I04', description: 'Equipo de computo y accesorios', applies_to: 'ALL' },
  { code: 'I05', description: 'Dados, troqueles, moldes, matrices y herramental', applies_to: 'ALL' },
  { code: 'I06', description: 'Comunicaciones telefónicas', applies_to: 'ALL' },
  { code: 'I07', description: 'Comunicaciones satelitales', applies_to: 'ALL' },
  { code: 'I08', description: 'Otra maquinaria y equipo', applies_to: 'ALL' },
  { code: 'D01', description: 'Honorarios médicos, dentales y gastos hospitalarios', applies_to: 'FISICA' },
  { code: 'D02', description: 'Gastos médicos por incapacidad o discapacidad', applies_to: 'FISICA' },
  { code: 'D03', description: 'Gastos funerales', applies_to: 'FISICA' },
  { code: 'D04', description: 'Donativos', applies_to: 'FISICA' },
  { code: 'D05', description: 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)', applies_to: 'FISICA' },
  { code: 'D06', description: 'Aportaciones voluntarias al SAR', applies_to: 'FISICA' },
  { code: 'D07', description: 'Primas por seguros de gastos médicos', applies_to: 'FISICA' },
  { code: 'D08', description: 'Gastos de transportación escolar obligatoria', applies_to: 'FISICA' },
  { code: 'D09', description: 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones', applies_to: 'FISICA' },
  { code: 'D10', description: 'Pagos por servicios educativos (colegiaturas)', applies_to: 'FISICA' },
  { code: 'S01', description: 'Sin efectos fiscales', applies_to: 'ALL' },
  { code: 'CP01', description: 'Pagos', applies_to: 'ALL' },
  { code: 'CN01', description: 'Nómina', applies_to: 'ALL' }
];

const states = [
  { code: 'AGS', name: 'Aguascalientes' }, { code: 'BC', name: 'Baja California' }, { code: 'BCS', name: 'Baja California Sur' },
  { code: 'CAMP', name: 'Campeche' }, { code: 'COAH', name: 'Coahuila de Zaragoza' }, { code: 'COL', name: 'Colima' },
  { code: 'CHIS', name: 'Chiapas' }, { code: 'CHIH', name: 'Chihuahua' }, { code: 'CDMX', name: 'Ciudad de México' },
  { code: 'DGO', name: 'Durango' }, { code: 'GTO', name: 'Guanajuato' }, { code: 'GRO', name: 'Guerrero' },
  { code: 'HGO', name: 'Hidalgo' }, { code: 'JAL', name: 'Jalisco' }, { code: 'MEX', name: 'Estado de México' },
  { code: 'MIC', name: 'Michoacán de Ocampo' }, { code: 'MOR', name: 'Morelos' }, { code: 'NAY', name: 'Nayarit' },
  { code: 'NL', name: 'Nuevo León' }, { code: 'OAX', name: 'Oaxaca' }, { code: 'PUE', name: 'Puebla' },
  { code: 'QRO', name: 'Querétaro' }, { code: 'QROO', name: 'Quintana Roo' }, { code: 'SLP', name: 'San Luis Potosí' },
  { code: 'SIN', name: 'Sinaloa' }, { code: 'SON', name: 'Sonora' }, { code: 'TAB', name: 'Tabasco' },
  { code: 'TAM', name: 'Tamaulipas' }, { code: 'TLAX', name: 'Tlaxcala' }, { code: 'VER', name: 'Veracruz de Ignacio de la Llave' },
  { code: 'YUC', name: 'Yucatán' }, { code: 'ZAC', name: 'Zacatecas' }
];

async function main() {
  console.log('🌱 Inicializando Catálogos Oficiales...');

  // 1. Regímenes Fiscales
  console.log('Inyectando Regímenes Fiscales SAT...');
  for (const r of regimes) {
    await prisma.satRegime.upsert({
      where: { code: r.code },
      update: r,
      create: r
    });
  }

  // 2. Uso CFDI
  console.log('Inyectando Catálogo de Uso CFDI SAT...');
  for (const c of cfdiUses) {
    await prisma.satCfdiUse.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
  }

  // 3. País y Estados
  console.log('Inyectando Catálogo Geográfico (México y Estados)...');
  const country = await prisma.geoCountry.upsert({
    where: { code: 'MEX' },
    update: { name: 'México' },
    create: { code: 'MEX', name: 'México' }
  });

  let stateCount = 0;
  for (const s of states) {
    const existing = await prisma.geoState.findFirst({ where: { code: s.code, country_id: country.id } });
    if (!existing) {
       await prisma.geoState.create({
          data: { code: s.code, name: s.name, country_id: country.id }
       });
       stateCount++;
    }
  }

  console.log('=================================');
  console.log('✅ MIGRADOS Y GUARDADOS CORRECTAMENTE:');
  console.log(` - ${regimes.length} Regímenes Fiscales`);
  console.log(` - ${cfdiUses.length} Usos de CFDI`);
  console.log(` - 1 País (México) y ${stateCount > 0 ? stateCount : states.length} Estados.`);
  console.log('=================================');
  console.log('NOTA: Para los Códigos Postales, debido a su tamaño (145,000+ renglones), es altamente recomendable usar un servicio de autocompletado por API REST (ej. API Sepomex gratuita en FrontEnd) para no penalizar el rendimiento del servidor. ¡Te puedo montar esa integración automática en la interfaz de Clientes!');

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
