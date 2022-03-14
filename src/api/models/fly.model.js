const { Model, raw } = require("objection")

class FlyModel extends Model {
    static get tableName() {
        return 'flies';
    }

    static modifiers = {
        includeFavoriteStatus(query, user_id) {
            console.log(user_id)
            query.select(raw('CASE WHEN EXISTS (SELECT fly_id FROM favorites WHERE user_id=:_user_id and fly_id=flies.id) THEN TRUE ELSE FALSE END AS is_favorite', { _user_id: user_id }))
        },

        includeAggregateTags(query) {
            query.select(FlyModel.relatedQuery('tags')
                .select(raw("string_agg(tags.title, ',' order by tags.title)"))
                .as('tag_list'))
        }

    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'description'],

            properties: {
                id: {type: 'integer'},
                name: {type: 'string'},
                score: {type: 'integer'},
                user_id: {type: 'string'},
                description: {type: 'string'},
                image_url: {type: 'string'},
                variant_of: {type: ['integer', 'null']}
            }
        }
    }

    static get relationMappings() {
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
            tags: {
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

module.exports = FlyModel;