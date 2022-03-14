const { Model } = require("objection")

class FlyModel extends Model {
    static get tableName() {
        return 'flies';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],

            properties: {
                id: {type: 'integer'},
                name: {type: 'string'},
                score: {type: 'integer'},
                description: {type: 'string'},
                image_url: {type: 'string'},
                variant_of: {type: 'integer'}
            }
        }
    }

    static get relationMapping() {
        const Tag = require('./tag.model')
        const User = require('./user.model')

        return {
            user: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'flies.user_id',
                    to: 'users.id'
                }
            },
            tag: {
                relation: Model.ManyToManyRelation,
                modelClass: Tag,
                join: {
                    from: 'flies.id',
                    through: {
                        from: 'fly_tags.fly_id',
                        to: 'fly_tags.tag_id'
                    },
                    to: 'tags.id'
                }
            },
            variant: {
                relation: Model.HasOneRelation,
                modelClass: FlyModel,
                join: {
                    from: 'flies.variant_of',
                    to: 'flies.id'
                }

            }
        }
    }
}