const bcrypt = require('bcrypt');
bcrypt.hash('neuesPasswort123', 10).then(console.log);
