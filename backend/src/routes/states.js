module.exports = (prisma) => {
    const router = require('express').Router();
  
    // GET all states (with optional country filter)
    router.get('/', async (req, res) => {
      try {
        const { countryId } = req.query;
        
        const whereClause = countryId ? { countryId: parseInt(countryId) } : {};
        
        const states = await prisma.state.findMany({
          where: whereClause,
          include: {
            Country: true,
            cities: true
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        res.json(states);
      } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({ error: 'Failed to fetch states' });
      }
    });
  
    // GET single state by ID
    router.get('/:id', async (req, res) => {
      try {
        const state = await prisma.state.findUnique({
          where: { id: parseInt(req.params.id) },
          include: {
            Country: true,
            cities: {
              include: {
                projects: true
              }
            }
          }
        });
  
        if (!state) {
          return res.status(404).json({ error: 'State not found' });
        }
  
        res.json(state);
      } catch (error) {
        console.error('Error fetching state:', error);
        res.status(500).json({ error: 'Failed to fetch state' });
      }
    });
  
    // POST create new state
    router.post('/', async (req, res) => {
      try {
        const { name, countryId } = req.body;
  
        if (!name || !countryId) {
          return res.status(400).json({ error: 'Name and countryId are required' });
        }
  
        // Verify country exists
        const country = await prisma.country.findUnique({
          where: { id: parseInt(countryId) }
        });
  
        if (!country) {
          return res.status(400).json({ error: 'Country does not exist' });
        }
  
        const newState = await prisma.state.create({
          data: {
            name,
            countryId: parseInt(countryId)
          },
          include: {
            Country: true
          }
        });
  
        res.status(201).json(newState);
      } catch (error) {
        console.error('Error creating state:', error);
        res.status(500).json({ error: 'Failed to create state' });
      }
    });
  
    // PUT update state
    router.put('/:id', async (req, res) => {
      try {
        const { name, countryId } = req.body;
  
        if (!name && !countryId) {
          return res.status(400).json({ error: 'Provide at least one field to update' });
        }
  
        const updateData = {};
        if (name) updateData.name = name;
        if (countryId) updateData.countryId = parseInt(countryId);
  
        const updatedState = await prisma.state.update({
          where: { id: parseInt(req.params.id) },
          data: updateData,
          include: {
            Country: true,
            cities: true
          }
        });
  
        res.json(updatedState);
      } catch (error) {
        console.error('Error updating state:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'State not found' });
        }
        
        res.status(500).json({ error: 'Failed to update state' });
      }
    });
  
    // DELETE state
    router.delete('/:id', async (req, res) => {
      try {
        await prisma.state.delete({
          where: { id: parseInt(req.params.id) }
        });
  
        res.status(204).end();
      } catch (error) {
        console.error('Error deleting state:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'State not found' });
        }
        
        res.status(500).json({ error: 'Failed to delete state' });
      }
    });
  
    return router;
  };