// Deny Animes Hub - Express Server
// High-performance backend with Supabase integration

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "https://api.themoviedb.org"],
            mediaSrc: ["'self'", "https:", "http:"],
            frameSrc: ["'self'", "https:", "http:"]
        }
    }
}));

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Routes
const animeRoutes = require('./routes/animes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Use routes
app.use('/api/animes', animeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('pages/index');
});

// Catalog route
app.get('/catalog', (req, res) => {
    res.render('pages/catalog');
});

// Anime detail route
app.get('/anime/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data: anime, error } = await supabase
            .from('animes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        res.render('pages/anime-detail', { anime });
    } catch (error) {
        console.error('Error fetching anime:', error);
        res.status(404).render('pages/404');
    }
});

// Watch route
app.get('/watch/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data: episode, error } = await supabase
            .from('episodes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        res.render('pages/watch', { episode });
    } catch (error) {
        console.error('Error fetching episode:', error);
        res.status(404).render('pages/404');
    }
});

// Admin routes
app.get('/admin', (req, res) => {
    res.render('admin/dashboard');
});

// Error handling
app.use((req, res) => {
    res.status(404).render('pages/404');
});

app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).render('pages/500');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Deny Animes Hub running on http://localhost:${PORT}`);
    console.log(`🎭 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔥 Akatsuki Ascendente mode activated`);
});