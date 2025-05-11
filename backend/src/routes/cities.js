module.exports = (prisma) => {
    const router = require('express').Router();
  
    // GET all cities (with optional state filter)
    router.get('/', async (req, res) => {
      try {
        const { stateId, includeState, includeProjects } = req.query;
        
        const whereClause = stateId ? { stateId: parseInt(stateId) } : {};
        
        const includeClause = {
          State: includeState === 'true',
          projects: includeProjects === 'true' ? {
            include: {
              ProjectType: true,
              UnitVariants: true
            }
          } : false
        };
  
        const cities = await prisma.city.findMany({
          where: whereClause,
          include: includeClause,
          orderBy: {
            name: 'asc'
          }
        });
        
        res.json(cities);
      } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
      }
    });
  
    // GET single city by ID
    router.get('/:id', async (req, res) => {
      try {
        const city = await prisma.city.findUnique({
          where: { id: parseInt(req.params.id) },
          include: {
            State: {
              include: {
                Country: true
              }
            },
            projects: {
              include: {
                ProjectType: true,
                UnitVariants: true
              }
            }
          }
        });
  
        if (!city) {
          return res.status(404).json({ error: 'City not found' });
        }
  
        res.json(city);
      } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({ error: 'Failed to fetch city' });
      }
    });
  
    // POST create new city
    router.post('/', async (req, res) => {
      try {
        const { name, stateId } = req.body;
  
        if (!name || !stateId) {
          return res.status(400).json({ error: 'Name and stateId are required' });
        }
  
        // Verify state exists
        const state = await prisma.state.findUnique({
          where: { id: parseInt(stateId) }
        });
  
        if (!state) {
          return res.status(400).json({ error: 'State does not exist' });
        }
  
        const newCity = await prisma.city.create({
          data: {
            name,
            stateId: parseInt(stateId)
          },
          include: {
            State: true
          }
        });
  
        res.status(201).json(newCity);
      } catch (error) {
        console.error('Error creating city:', error);
        
        if (error.code === 'P2002') {
          return res.status(400).json({ error: 'City with this name already exists in the state' });
        }
        
        res.status(500).json({ error: 'Failed to create city' });
      }
    });
  
    // PUT update city
    router.put('/:id', async (req, res) => {
      try {
        const { name, stateId } = req.body;
  
        if (!name && !stateId) {
          return res.status(400).json({ error: 'Provide at least one field to update' });
        }
  
        const updateData = {};
        if (name) updateData.name = name;
        if (stateId) updateData.stateId = parseInt(stateId);
  
        const updatedCity = await prisma.city.update({
          where: { id: parseInt(req.params.id) },
          data: updateData,
          include: {
            State: true,
            projects: true
          }
        });
  
        res.json(updatedCity);
      } catch (error) {
        console.error('Error updating city:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'City not found' });
        }
        
        if (error.code === 'P2002') {
          return res.status(400).json({ error: 'City with this name already exists in the state' });
        }
        
        res.status(500).json({ error: 'Failed to update city' });
      }
    });
  
    // DELETE city
    router.delete('/:id', async (req, res) => {
      try {
        // Check if city has projects before deleting
        const projects = await prisma.project.count({
          where: { cityId: parseInt(req.params.id) }
        });
  
        if (projects > 0) {
          return res.status(400).json({ 
            error: 'Cannot delete city with associated projects',
            projectsCount: projects
          });
        }
  
        await prisma.city.delete({
          where: { id: parseInt(req.params.id) }
        });
  
        res.status(204).end();
      } catch (error) {
        console.error('Error deleting city:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'City not found' });
        }
        
        res.status(500).json({ error: 'Failed to delete city' });
      }
    });
  
    // GET projects for a specific city
    router.get('/:id/projects', async (req, res) => {
      try {
        const projects = await prisma.project.findMany({
          where: { cityId: parseInt(req.params.id) },
          include: {
            ProjectType: true,
            UnitVariants: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
  
        res.json(projects);
      } catch (error) {
        console.error('Error fetching city projects:', error);
        res.status(500).json({ error: 'Failed to fetch city projects' });
      }
    });
  
    return router;
  };