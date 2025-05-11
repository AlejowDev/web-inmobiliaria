module.exports = (prisma) => {
    const router = require('express').Router();

    // GET all countries
    router.get('/', async (req, res) => {
        try {
            const countries = await prisma.country.findMany({
                include: { states: true }
            });
            res.json(countries);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch countries' });
        }
    });

    // GET single country
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const country = await prisma.country.findUnique({
                where: { id: parseInt(id) },
                include: { states: true }
            });
            country ? res.json(country) : res.status(404).json({ error: 'Country not found' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch country' });
        }
    });

    // POST new country
    router.post('/', async (req, res) => {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        try {
            const newCountry = await prisma.country.create({ data: { name } });
            res.status(201).json(newCountry);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                // Código P2002 = Violación de restricción UNIQUE
                return res.status(409).json({ error: 'Country name already exists' });
            }

            res.status(500).json({ error: 'Failed to create country' });
        }
    });

    return router;
};