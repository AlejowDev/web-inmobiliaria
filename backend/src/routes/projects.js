module.exports = (prisma) => {
    const router = require('express').Router();
  
    // GET all projects with filtering options
    router.get('/', async (req, res) => {
      try {
        const { cityId, projectTypeId, minPrice, maxPrice, bedrooms } = req.query;
        
        const whereClause = {
          ...(cityId && { cityId: parseInt(cityId) }),
          ...(projectTypeId && { projectTypeId: parseInt(projectTypeId) }),
          ...((minPrice || maxPrice || bedrooms) && {
            UnitVariants: {
              some: {
                ...(minPrice && { priceFrom: { gte: parseFloat(minPrice) } }),
                ...(maxPrice && { priceFrom: { lte: parseFloat(maxPrice) } }),
                ...(bedrooms && { bedrooms: parseInt(bedrooms) })
              }
            }
          })
        };
  
        const projects = await prisma.project.findMany({
          where: whereClause,
          include: {
            City: {
              include: {
                State: true
              }
            },
            ProjectType: true,
            UnitVariants: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        res.json(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
      }
    });
  
    // GET single project by ID
    router.get('/:id', async (req, res) => {
      try {
        const project = await prisma.project.findUnique({
          where: { id: parseInt(req.params.id) },
          include: {
            City: {
              include: {
                State: true
              }
            },
            ProjectType: true,
            UnitVariants: {
              include: {
                Views: {
                  include: {
                    Client: true
                  }
                }
              }
            }
          }
        });
  
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
  
        res.json(project);
      } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
      }
    });
  
    // POST create new project
    router.post('/', async (req, res) => {
      try {
        const { title, description, cityId, projectTypeId } = req.body;
  
        if (!title || !cityId || !projectTypeId) {
          return res.status(400).json({ 
            error: 'Title, cityId and projectTypeId are required' 
          });
        }
  
        // Verify city and project type exist
        const [city, projectType] = await Promise.all([
          prisma.city.findUnique({ where: { id: parseInt(cityId) } }),
          prisma.projectType.findUnique({ where: { id: parseInt(projectTypeId) } })
        ]);
  
        if (!city) {
          return res.status(400).json({ error: 'City does not exist' });
        }
        if (!projectType) {
          return res.status(400).json({ error: 'Project type does not exist' });
        }
  
        const newProject = await prisma.project.create({
          data: {
            title,
            description,
            cityId: parseInt(cityId),
            projectTypeId: parseInt(projectTypeId)
          },
          include: {
            City: true,
            ProjectType: true
          }
        });
  
        res.status(201).json(newProject);
      } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
      }
    });
  
    // PUT update project
    router.put('/:id', async (req, res) => {
      try {
        const { title, description, cityId, projectTypeId } = req.body;
  
        if (!title && !description && !cityId && !projectTypeId) {
          return res.status(400).json({ error: 'Provide at least one field to update' });
        }
  
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (cityId) updateData.cityId = parseInt(cityId);
        if (projectTypeId) updateData.projectTypeId = parseInt(projectTypeId);
  
        const updatedProject = await prisma.project.update({
          where: { id: parseInt(req.params.id) },
          data: updateData,
          include: {
            City: true,
            ProjectType: true,
            UnitVariants: true
          }
        });
  
        res.json(updatedProject);
      } catch (error) {
        console.error('Error updating project:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        res.status(500).json({ error: 'Failed to update project' });
      }
    });
  
    // DELETE project (will cascade delete unit variants)
    router.delete('/:id', async (req, res) => {
      try {
        await prisma.project.delete({
          where: { id: parseInt(req.params.id) }
        });
  
        res.status(204).end();
      } catch (error) {
        console.error('Error deleting project:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        res.status(500).json({ error: 'Failed to delete project' });
      }
    });
  
    // POST add unit variant to project
    router.post('/:id/unit-variants', async (req, res) => {
      try {
        const { area, bedrooms, bathrooms, parking, priceFrom, available } = req.body;
  
        if (!area || !bedrooms || !bathrooms || !parking || !priceFrom) {
          return res.status(400).json({ 
            error: 'All unit variant fields are required except available' 
          });
        }
  
        const newVariant = await prisma.unitVariant.create({
          data: {
            projectId: parseInt(req.params.id),
            area: parseFloat(area),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            parking: parseInt(parking),
            priceFrom: parseFloat(priceFrom),
            available: available !== undefined ? available : true
          }
        });
  
        res.status(201).json(newVariant);
      } catch (error) {
        console.error('Error adding unit variant:', error);
        
        if (error.code === 'P2003') {
          return res.status(400).json({ error: 'Project does not exist' });
        }
        
        res.status(500).json({ error: 'Failed to add unit variant' });
      }
    });
  
    return router;
  };