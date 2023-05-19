const config = require("./config");
const db = require("../sequelize/models");
const Op = db.Sequelize.Op;

const unixEpochTimeInMilliseconds = getUnixTimeFromHours(config.expiryTimeInHours)
const timeStringAt24HoursPrior = new Date(new Date().getTime() - unixEpochTimeInMilliseconds).toISOString()
const isActiveCondition = { 
  mergedAt: { [Op.eq]: null },
  createdAt: { [Op.gte]: timeStringAt24HoursPrior }
};

const buildIsActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    createdAt: { [Op.gte]: timeStringAt24HoursPrior },
    mergedAt: { [Op.eq]: null }, // no mergedAt
    // archivedAt: { [Op.eq]: null } // no archivedAt
    // [Op.or]: {
    //   // active conditions when review hasn't expired
    //   [Op.and]: {
    //     createdAt: { [Op.gte]: timeStringAt24HoursPrior }, // not expired
    //     mergedAt: { [Op.eq]: null }, // no mergedAt
    //     archivedAt: { [Op.eq]: null } // no archivedAt
    //   },
    //   // active conditions when review has expired
    //   [Op.and]: {
    //     createdAt: { [Op.gte]: timeStringAt24HoursPrior }, // expired
    //     submittedAt: { [Op.not]: null }, // has been submitted
    //     mergedAt: { [Op.eq]: null }, // no mergedAt
    //     archivedAt: { [Op.eq]: null } // no archivedAt
    //   }
    // }
    // [Op.or]: {
    //   createdAt: { [Op.gte]: timeStringAt24HoursPrior }, // not expired
    //   submittedAt: { [Op.not]: null }, // has been submitted
    // },
    // mergedAt: { [Op.eq]: null }, // no mergedAt
    // archivedAt: { [Op.eq]: null } // no archivedAt
  };
}
const buildIsPendingCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    submittedAt: { [Op.not]: null }, // has been submitted
    mergedAt: { [Op.eq]: null }, // no mergedAt
    // archivedAt: { [Op.eq]: null } // no archivedAt
  };
}

const buildIsInActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    [Op.or]: {
      mergedAt: { [Op.not]: null }, // has been merged
      // archivedAt: { [Op.not]: null }, // has been archived
      // inactive conditions when review has expired
      [Op.and]: {
        createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
        submittedAt: { [Op.eq]: null }, // has not been submitted
      }
    }
  };
}

const isInActiveCondition = {
  [Op.or]: [
    // the review as expired and submittedAt is null
    {[Op.and]: {
      createdAt: { [Op.lt]: timeStringAt24HoursPrior },
      submittedAt: { [Op.is]: null }
    }},
    // or achivedAt is not null
    { archivedAt: { [Op.not]: null } }
  ]
}

function getUnixTimeFromHours(hours) {
  const millisecondsInHour = 60 * 60 * 1000;
  const unixTimeInMilliseconds = hours * millisecondsInHour;
  return unixTimeInMilliseconds;
}

module.exports = {
  isActiveCondition,
  isInActiveCondition,
  getUnixTimeFromHours,
  buildIsActiveCondition,
  buildIsPendingCondition,
  buildIsInActiveCondition,
}
