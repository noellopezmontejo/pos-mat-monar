const { prisma } = require('../db');

const getCatalogs = async (req, res) => {
  try {
    const rawRegimes = await prisma.catRegimenSatNuevo.findMany({ orderBy: { Regimen: 'asc' } });
    const rawCfdi = await prisma.catUsoCfdiSatNuevo.findMany({ orderBy: { c_UsoCFDI: 'asc' } });
    
    // Map to the existing UI expected format
    const regimes = rawRegimes.map(r => ({ ...r, code: r.Regimen, description: r.Descripcion }));
    const cfdiUses = rawCfdi.map(c => ({ ...c, code: c.c_UsoCFDI, description: c.Descripcion }));

    res.json({ regimes, cfdiUses });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching catalogs from DB' });
  }
};

const getZipCodeInfo = async (req, res) => {
  const { zip } = req.params;
  try {
    const cpEntry = await prisma.cCp.findFirst({ where: { c_CP: zip } });
    if (!cpEntry) return res.json([]);

    const estado = await prisma.cEstado.findFirst({ where: { c_Estado: cpEntry.c_Estado } });
    const municipio = await prisma.cMunicipio.findFirst({ 
        where: { c_Estado: cpEntry.c_Estado, c_Municipio: cpEntry.c_Municipio } 
    });

    const colonias = await prisma.cColonia.findMany({
        where: { c_CodigoPostal: zip },
        orderBy: { Nombre: 'asc' }
    });

    const mappedLocations = colonias.map(c => ({
        id: c.Id,
        zip_code: zip,
        settlement: c.Nombre,
        type: 'Colonia',
        municipality: municipio?.Descripcion || '',
        state: { name: estado?.Descripcion || '' }
    }));

    res.json(mappedLocations);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching zip info from DB' });
  }
};

module.exports = { getCatalogs, getZipCodeInfo };
