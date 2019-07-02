const express = require('express')
const FoldersService = require('./folders-service')
const xss = require('xss')
const foldersRouter = express.Router()
const jsonParser = express.json()
const path = require('path')

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name),
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const connect = req.app.get('db')
        FoldersService.getAllFolders(connect)
            .then(notes => {
                res.json(notes.map(serializeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const connect = req.app.get('db')
        const {name} = req.body
        const newFolder = {name}

        for(const [key, value] of Object.entries(newFolder)) {
            if(value == null) {
                return res.status(400).json({
                    error: {mesage: `Missing '${key}' in request body`}
                })
            }
        }

        FoldersService.insertFolder(connect, newFolder)
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })
foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        const connect = req.app.get('db')
        FoldersService.getById(connect, req.params.folder_id)
            .then(folder => {
            if(!folder) {
                return res.status(404).json({
                    error: {message: `Folder does not exist`}
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        const connect = req.app.get('db')
        FoldersService.deleteFolder(connect, req.params.folder_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const connect = req.app.get('db')
        const{name} = req.body
        const folderToUpdate = {name}

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'name' or 'content'`
                }
            })
        }
        FoldersService.updateFolder(
            connect, 
            req.params.folder_id,
            folderToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
module.exports = foldersRouter