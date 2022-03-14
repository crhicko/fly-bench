const { Model } = require("objection")

class UserModel extends Model {
    static get tableName() {
        return 'users';
    }

    static get relationMappings() {
        const Fly = require('./fly.model')

        return {
            fly: {
                relation: Model.HasOneRelation,
                modelClass: Fly,
                join: {
                    from: 'users.id',
                    to: 'flies.user_id'
                }
            }
        }
    }
}

module.exports = UserModel;