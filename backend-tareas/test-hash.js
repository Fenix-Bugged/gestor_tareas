const bcrypt = require('bcryptjs');

const hash = '$2b$10$Xz4V6zFk6Bl3btnPc7wbBu.EeV7AvMx3xJbiTr1xYHbsY0jZHDMdu';
bcrypt.compare('admin123', hash).then(res => {
    console.log("Match admin123?", res);
});
