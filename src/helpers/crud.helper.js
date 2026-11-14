import asyncHandler from './async-handler.helper.js';
import { assertFound } from './http-error.helper.js';

/**
 * Fábricas para recursos que son un CRUD puro (sin reglas de negocio propias).
 * Evitan repetir las mismas cinco consultas y los mismos cinco handlers por entidad.
 */
const createCrudService = (Model) => ({
    create: (data) => Model.create(data),
    getById: (id) => Model.findOne({ _id: id }),
    getAll: () => Model.find(),
    update: (id, data) => Model.findOneAndUpdate({ _id: id }, data, { returnDocument: 'after', runValidators: true }),
    remove: (id) => Model.findOneAndDelete({ _id: id })
});

/**
 * @param {ReturnType<typeof createCrudService>} service
 * @param {Object} messages - Textos de `msg` por operación, `notFound` para el 404 y
 *        `errors` con el mensaje del 500 de cada operación
 */
const createCrudController = (service, messages) => ({
    create: asyncHandler(async (req, res) => {
        const data = await service.create(req.body);

        res.status(201).json({ msg: messages.create, data });
    }, messages.errors.create),

    getById: asyncHandler(async (req, res) => {
        const data = assertFound(await service.getById(req.params.id), messages.notFound);

        res.json({ msg: messages.getById, data });
    }, messages.errors.getById),

    getAll: asyncHandler(async (req, res) => {
        const data = await service.getAll();

        res.json({ msg: messages.getAll, data });
    }, messages.errors.getAll),

    update: asyncHandler(async (req, res) => {
        const data = assertFound(await service.update(req.params.id, req.body), messages.notFound);

        res.json({ msg: messages.update, data });
    }, messages.errors.update),

    remove: asyncHandler(async (req, res) => {
        const data = assertFound(await service.remove(req.params.id), messages.notFound);

        res.json({ msg: messages.remove, data });
    }, messages.errors.remove)
});

export { createCrudService, createCrudController };
