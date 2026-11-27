import bcrypt from 'bcrypt';

// Coste 9 = 2^9 rondas. Cada +1 duplica el tiempo de hash (y el de un ataque de fuerza bruta).
// Se usan las variantes asíncronas: el cálculo corre en el pool de hilos de libuv y no bloquea
// el event loop, así un login no frena las demás peticiones. Ambas devuelven una Promise (usar await).
const SALT_ROUNDS = 9;

// El hash resultante ya incluye la sal y el coste ("$2b$09$<sal><hash>"): no se guardan aparte.
const generatePassword = (originalPassword) => bcrypt.hash(originalPassword, SALT_ROUNDS);

// Compara en tiempo constante contra el hash guardado
const verifyPassword = (originalPassword, hashPassword) => bcrypt.compare(originalPassword, hashPassword);

export {
    generatePassword,
    verifyPassword
};
