import { Router } from 'express';
import { recipeRouter } from './recipe.routes';
import { eventRouter } from './event.routes';
import { authRouter } from './auth.routes';
import { cartRouter } from './cart.routes';

const mainRouter = Router();

mainRouter.use('/recipes', recipeRouter);
mainRouter.use('/events', eventRouter);
mainRouter.use('/', authRouter);
mainRouter.use('/cart', cartRouter);

export default mainRouter;