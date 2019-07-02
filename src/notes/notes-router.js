const express = require('express')
const NotesService = require('./notes-service')
const xss = require('xss')
const notesRouter = express.Router()
const jsonParser = express.json()
const path = require('path')

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    content: xss(note.content),
    folder_id: note.folder_id,
    modified: note.modified
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const connect = req.app.get('db')
        NotesService.getAllNotes(connect)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const connect = req.app.get('db')
        const {name, content, folder_id} = req.body
        const newNote = {name, content}

        for(const [key, value] of Object.entries(newNote)) {
            if(value == null) {
                return res.status(400).json({
                    error: {mesage: `Missing '${key}' in request body`}
                })
            }
        }
        newNote.folder_id = folder_id

        NotesService.insertNote(connect, newNote)
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)
    })
notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        const connect = req.app.get('db')
        NotesService.getById(connect, req.params.note_id)
            .then(note => {
            if(!note) {
                return res.status(404).json({
                    error: {message: `Note does not exist`}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note))
    })
    .delete((req, res, next) => {
        const connect = req.app.get('db')
        NotesService.deleteNote(connect, req.params.note_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const connect = req.app.get('db')
        const{name, content} = req.body
        const noteToUpdate = {name, content}

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'name' or 'content'`
                }
            })
        }
        NotesService.updateNote(
            connect, 
            req.params.note_id,
            noteToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
module.exports = notesRouter