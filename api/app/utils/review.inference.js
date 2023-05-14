const config = require("./config");
const db = require("../sequelize/models");
const Op = db.Sequelize.Op;

const isActiveCondition = { 
  mergedAt: { [Op.eq]: null },
  createdAt: { [Op.gte]: new Date().getTime() - getUnixTimeFromHours(config.expiryTimeInHours) }
};

function getUnixTimeFromHours(hours) {
  const millisecondsInHour = 60 * 60 * 1000;
  const milliseconds = hours * millisecondsInHour;

  // Get the UNIX epoch time in milliseconds
  const unixEpochTimeInMilliseconds = new Date('1970-01-01T00:00:00Z').getTime();

  // Add the calculated number of milliseconds to the UNIX epoch time
  const unixTimeInMilliseconds = unixEpochTimeInMilliseconds + milliseconds;

  return unixTimeInMilliseconds;
}

module.exports = {
  isActiveCondition,
  getUnixTimeFromHours,
}
