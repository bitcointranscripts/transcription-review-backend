module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    githubUsername: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    authToken: {
      type: Sequelize.STRING,
      unique: true
    },
    permissions: {
      type: Sequelize.ENUM('reviewer','admin'),
      allowNull: false,
      defaultValue: 'reviewer'
    },
    archivedAt: {
      type: Sequelize.DATE
    }
  });

  return User;
};
