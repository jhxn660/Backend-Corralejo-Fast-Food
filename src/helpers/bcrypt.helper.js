import bcrypt from 'bcrypt';

// Coste 9 = 2^9 rondas. Cada +1 duplica el tiempo de hash (y el de un ataque de fuerza bruta).
// Se usan las variantes síncronas a propósito: bloquean el event loop unos milisegundos,
// aceptable con este tráfico; con carga alta conviene pasar a bcrypt.hash/compare (async).
const SALT_ROUNDS = 9;

// El hash resultante ya incluye la sal y el coste ("$2b$09$<sal><hash>"): no se guardan aparte.
const generatePassword = (originalPassword) => bcrypt.hashSync(originalPassword, SALT_ROUNDS);

// Compara en tiempo constante contra el hash guardado
const verifyPassword = (originalPassword, hashPassword) => bcrypt.compareSync(originalPassword, hashPassword);

export {
    generatePassword,
    verifyPassword
};
