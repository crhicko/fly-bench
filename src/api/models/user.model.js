const { Model } = require("objection")

class FlyModel extends Model {
    static get tableName() {
        return 'users';
    }

    static get relationMapping() {
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