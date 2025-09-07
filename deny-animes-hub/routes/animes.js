const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// TMDB API
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get all animes with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const genre = req.query.genre || '';
        const year = req.query.year || '';
        const status = req.query.status || '';
        
        let query = supabase
            .from('animes')
            .select('*', { count: 'exact' })
            .order('popularity', { ascending: false });
            
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        
        if (genre) {
            query = query.contains('genres', [genre]);
        }
        
        if (year) {
            query = query.eq('year', parseInt(year));
        }
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data: animes, error, count } = await query
            .range((page - 1) * limit, page * limit - 1);
            
        if (error) throw error;
        
        res.json({
            animes,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching animes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get trending animes
router.get('/trending', async (req, res) => {
    try {
        const { data: animes, error } = await supabase
            .from('animes')
            .select('*')
            .eq('trending', true)
            .order('popularity', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        res.json(animes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anime by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: anime, error } = await supabase
            .from('animes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Fetch episodes
        const { data: episodes } = await supabase
            .from('episodes')
            .select('*')
            .eq('anime_id', id)
            .order('episode_number', { ascending: true });
            
        res.json({
            ...anime,
            episodes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anime recommendations
router.get('/:id/recommendations', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get anime genres
        const { data: anime } = await supabase
            .from('animes')
            .select('genres')
            .eq('id', id)
            .single();
            
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        
        // Get recommendations based on genres
        const { data: recommendations } = await supabase
            .from('animes')
            .select('*')
            .not('id', 'eq', id)
            .contains('genres', anime.genres)
            .limit(6);
            
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync with TMDB
router.post('/sync-tmdb', async (req, res) => {
    try {
        const { animeId } = req.body;
        
        // Fetch from TMDB
        const response = await axios.get(
            `${TMDB_BASE_URL}/tv/${animeId}?api_key=${TMDB_API_KEY}`
        );
        
        const animeData = response.data;
        
        // Update database
        const { data, error } = await supabase
            .from('animes')
            .upsert({
                id: animeData.id,
                title: animeData.name,
                description: animeData.overview,
                poster_path: animeData.poster_path,
                backdrop_path: animeData.backdrop_path,
                genres: animeData.genres.map(g => g.name),
                year: new Date(animeData.first_air_date).getFullYear(),
                rating: animeData.vote_average,
                episode_count: animeData.number_of_episodes,
                status: animeData.status,
                updated_at: new Date().toISOString()
            });
            
        if (error) throw error;
        
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;