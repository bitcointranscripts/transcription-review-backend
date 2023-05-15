const config = require("./config");
const db = require("../sequelize/models");
const Op = db.Sequelize.Op;

const unixEpochTimeInMilliseconds = getUnixTimeFromHours(config.expiryTimeInHours)
const timeStringAt24HoursPrior = new Date(new Date().getTime() - unixEpochTimeInMilliseconds).toISOString()
const isActiveCondition = { 
  mergedAt: { [Op.eq]: null },
  createdAt: { [Op.gte]: timeStringAt24HoursPrior }
};

const isInActiveCondition = {
  [Op.or]: [
    { createdAt: { [Op.lt]: timeStringAt24HoursPrior } },
    { mergedAt: { [Op.not]: null } }
  ]
}

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
  isInActiveCondition,
  getUnixTimeFromHours,
}
