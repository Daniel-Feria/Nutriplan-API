import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    etiqueta: 'NutriPlan',
  });
});

router.get(['/contactos', '/Contactos'], (req, res) => {
  res.render('contactos', {
    etiqueta: 'Contactos | NutriPlan',
  });
});

router.get(['/sobre_nosotros', '/Sobre_Nosotros'], (req, res) => {
  res.render('Sobre_Nosotros', {
    etiqueta: 'Sobre nosotros | NutriPlan',
  });
});

router.get('/login', (req, res) => {
  res.render('login', {
    etiqueta: 'Iniciar sesión | NutriPlan',
  });
});

router.get('/registro', (req, res) => {
  res.render('registro', {
    etiqueta: 'Registro | NutriPlan',
  });
});

router.get('/nutricion', (req, res) => {
  res.render('nutricion', {
    etiqueta: 'Mi nutrición | NutriPlan',
  });
});

router.get('/logout', (req, res) => {
  res.redirect('/');
});

export default router;
