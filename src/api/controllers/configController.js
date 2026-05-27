const { prisma } = require('../db')
const path = require('path')
const fs = require('fs')

// GET /api/config/profile
const getProfile = async (req, res) => {
  try {
    let profile = await prisma.companyProfile.findFirst()
    
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          name: 'CIMENTA',
          trade_name: 'Sistema CIMENTA',
          receipt_message: '¡Gracias por su compra!',
          app_name: 'NC INTEGRAX',
          branding_key: 'NC-2026-ADMIN'
        }
      })
    }
    
    res.json(profile)
  } catch (error) {
    console.error('Error fetching company profile:', error)
    res.status(500).json({ error: 'Error al cargar perfil de la empresa' })
  }
}

// POST /api/config/profile
const updateProfile = async (req, res) => {
  try {
    const { 
      name, trade_name, rfc, address, phone, email, website, receipt_message, 
      ticket_config, app_name, branding_key, show_by_nc 
    } = req.body
    
    let parsedTicketConfig = undefined;
    if (ticket_config) {
       try {
          parsedTicketConfig = JSON.parse(ticket_config);
       } catch(e) {
          console.error('Invalid ticket config format:', e);
       }
    }

    let profile = await prisma.companyProfile.findFirst()
    
    let logo_url = profile ? profile.logo_url : null
    let app_logo_url = profile ? profile.app_logo_url : null
    let app_icon_url = profile ? profile.app_icon_url : null
    
    // Handle multiple files if sent (logo, app_logo, app_icon)
    if (req.files) {
      if (req.files.logo) logo_url = `/uploads/logos/${req.files.logo[0].filename}`
      if (req.files.app_logo) app_logo_url = `/uploads/logos/${req.files.app_logo[0].filename}`
      if (req.files.app_icon) app_icon_url = `/uploads/logos/${req.files.app_icon[0].filename}`
    } else if (req.file) {
      // Legacy single file upload
      logo_url = `/uploads/logos/${req.file.filename}`
    }

    const updateData = {
      name: name || profile?.name,
      trade_name: trade_name || profile?.trade_name,
      rfc: rfc || profile?.rfc,
      address: address || profile?.address,
      phone: phone || profile?.phone,
      email: email || profile?.email,
      website: website || profile?.website,
      receipt_message: receipt_message || profile?.receipt_message,
      ticket_config: parsedTicketConfig !== undefined ? parsedTicketConfig : profile?.ticket_config,
      logo_url,
      app_name: app_name || profile?.app_name,
      app_logo_url,
      app_icon_url,
      branding_key: branding_key || profile?.branding_key,
      show_by_nc: show_by_nc !== undefined ? (show_by_nc === 'true' || show_by_nc === true) : profile?.show_by_nc
    }

    if (profile) {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: updateData
      })
    } else {
      profile = await prisma.companyProfile.create({
        data: updateData
      })
    }
    
    res.json(profile)
  } catch (error) {
    console.error('Error updating company profile:', error)
    res.status(500).json({ error: 'Error al actualizar perfil de la empresa' })
  }
}

module.exports = { getProfile, updateProfile }
