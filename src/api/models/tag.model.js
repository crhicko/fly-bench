const { Model } = require("objection")

class TagModel extends Model {
    static get tableName() {
        return 'tag';
    }

    static get relationMapping() {
        const Fly = require('./fly.model')

        return {
            fly: {
                relation: Model.ManyToManyRelation,
                modelClass: Fly,
                join: {
                    from: 'tag.id',
                    through: {
                        from: 'fly_tags.tag_id',
                        to: 'fly_tags.fly_id'
                    },
                    to: 'flies.id'
                }
            }
        }
    }
}