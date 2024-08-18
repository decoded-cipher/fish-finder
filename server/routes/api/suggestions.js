
const express = require('express');
const router = express.Router();

const Suggestion = require('../../models/suggestions');
const verifyToken = require('../../middleware/authentication');
const e = require('express');



/**
 * @route   GET /api/v1/suggestions
 * @desc    Get all suggestions with pagination
 * @access  Public
 * @params  page, limit, search
 * @return  message, data
 * @error   400, { error }
 * @status  200, 400
 * 
 * @example /api/v1/suggestions?page=1&limit=10
**/

router.get('/', async (req, res) => {

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let search = req.query.search || null;

    let query = {};
    if (search) {
        query = { $text: { $search: search } };
    }

    let totalitems = await Suggestion.countDocuments(query)
        .catch(err => {
            res.status(400).json({
                status: 400,
                message: 'Error retrieving suggestions',
                error: err
            });
        });

    let suggestions = await Suggestion.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .catch(err => {
            res.status(400).json({
                status: 400,
                message: 'Error retrieving suggestions',
                error: err
            });
        });

    res.status(200).json({
        status: 200,
        message: 'Suggestions retrieved successfully',
        data: {
            suggestions: suggestions,
            meta: {
                page: page,
                limit: limit,
                pages: Math.ceil(totalitems / limit),
                total: totalitems,
                search: search
            }
        }
    });

});



/**
 * @route   POST /api/v1/suggestions
 * @desc    Create new suggestion
 * @access  Admin, Super Admin
 * @params  author, suggestion_id, email, message, status
 * @return  message, data
 * @error   400, { error }
 * @status  201, 400
 * 
 * @example /api/v1/suggestions
**/

router.post('/', verifyToken, async (req, res) => {
    const newSuggestion = new Suggestion({
        author: req.body.author,
        suggestion_id: req.body.suggestion_id,
        email: req.body.email,
        message: req.body.message,
        status: req.body.status
    });

    await newSuggestion.save()
        .then(suggestion => {
            res.status(201).json({
                status: 201,
                message: 'Suggestion created successfully',
                data: suggestion
            });
        })
        .catch(err => {
            res.status(400).json({
                status: 400,
                message: 'Error creating suggestion',
                error: err
            });
        });
});



/**
 * @route   PATCH /api/v1/suggestions/:id
 * @desc    Mark suggestion as acknowledged or resolved
 * @access  Admin, Super Admin
 * @params  status
 * @return  message, data
 * @error   400, { error }
 * @status  200, 400
 * 
 * @example /api/v1/suggestions/123456
**/

router.patch('/:id', verifyToken, async (req, res) => {
    const suggestionId = req.params.id;

    await Suggestion.findOneAndUpdate({ suggestion_id: suggestionId }, {
        status: req.body.status,
        updated_at: Date.now()
    })
        .then(suggestion => {
            res.status(200).json({
                status: 200,
                message: 'Suggestion updated successfully',
                data: suggestion
            });
        })
        .catch(err => {
            res.status(400).json({
                status: 400,
                message: 'Error updating suggestion',
                error: err
            });
        });
});



module.exports = router;