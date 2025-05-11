module.exports = (prisma) => {
    const router = require('express').Router();
  
    // GET all clients with their view history
    router.get('/', async (req, res) => {
      try {
        const clients = await prisma.client.findMany({
          include: {
            views: {
              include: {
                UnitVariant: {
                  include: {
                    Project: true
                  }
                }
              },
              orderBy: {
                viewedAt: 'desc'
              }
            }
          },
          orderBy: {
            fullName: 'asc'
          }
        });
        
        res.json(clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
      }
    });
  
    // GET single client by ID
    router.get('/:id', async (req, res) => {
      try {
        const client = await prisma.client.findUnique({
          where: { id: parseInt(req.params.id) },
          include: {
            views: {
              include: {
                UnitVariant: {
                  include: {
                    Project: {
                      include: {
                        City: true,
                        ProjectType: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                viewedAt: 'desc'
              }
            }
          }
        });
  
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
  
        res.json(client);
      } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
      }
    });
  
    // POST create new client
    router.post('/', async (req, res) => {
      try {
        const { fullName, email, phone } = req.body;
  
        if (!fullName || !email) {
          return res.status(400).json({ error: 'Full name and email are required' });
        }
  
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
  
        const newClient = await prisma.client.create({
          data: {
            fullName,
            email,
            phone
          }
        });
  
        res.status(201).json(newClient);
      } catch (error) {
        console.error('Error creating client:', error);
        
        if (error.code === 'P2002') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        
        res.status(500).json({ error: 'Failed to create client' });
      }
    });
  
    // PUT update client
    router.put('/:id', async (req, res) => {
      try {
        const { fullName, email, phone } = req.body;
  
        if (!fullName && !email && !phone) {
          return res.status(400).json({ error: 'Provide at least one field to update' });
        }
  
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
  
        const updatedClient = await prisma.client.update({
          where: { id: parseInt(req.params.id) },
          data: updateData
        });
  
        res.json(updatedClient);
      } catch (error) {
        console.error('Error updating client:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Client not found' });
        }
        
        if (error.code === 'P2002') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        
        res.status(500).json({ error: 'Failed to update client' });
      }
    });
  
    // DELETE client (will cascade delete views)
    router.delete('/:id', async (req, res) => {
      try {
        await prisma.client.delete({
          where: { id: parseInt(req.params.id) }
        });
  
        res.status(204).end();
      } catch (error) {
        console.error('Error deleting client:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Client not found' });
        }
        
        res.status(500).json({ error: 'Failed to delete client' });
      }
    });
  
    // POST record a client view of a unit variant
    router.post('/:clientId/views', async (req, res) => {
      try {
        const { unitVariantId } = req.body;
  
        if (!unitVariantId) {
          return res.status(400).json({ error: 'unitVariantId is required' });
        }
  
        // Verify client and unit variant exist
        const [client, unitVariant] = await Promise.all([
          prisma.client.findUnique({ where: { id: parseInt(req.params.clientId) } }),
          prisma.unitVariant.findUnique({ where: { id: parseInt(unitVariantId) } })
        ]);
  
        if (!client) {
          return res.status(400).json({ error: 'Client does not exist' });
        }
        if (!unitVariant) {
          return res.status(400).json({ error: 'Unit variant does not exist' });
        }
  
        const newView = await prisma.clientView.create({
          data: {
            clientId: parseInt(req.params.clientId),
            unitVariantId: parseInt(unitVariantId)
          },
          include: {
            Client: true,
            UnitVariant: {
              include: {
                Project: true
              }
            }
          }
        });
  
        res.status(201).json(newView);
      } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ error: 'Failed to record view' });
      }
    });
  
    // GET client's viewing history
    router.get('/:id/views', async (req, res) => {
      try {
        const views = await prisma.clientView.findMany({
          where: { clientId: parseInt(req.params.id) },
          include: {
            UnitVariant: {
              include: {
                Project: {
                  include: {
                    City: true,
                    ProjectType: true
                  }
                }
              }
            }
          },
          orderBy: {
            viewedAt: 'desc'
          }
        });
  
        res.json(views);
      } catch (error) {
        console.error('Error fetching client views:', error);
        res.status(500).json({ error: 'Failed to fetch client views' });
      }
    });
  
    return router;
  };