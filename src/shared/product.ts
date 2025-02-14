import { Allow, Entity, Fields } from "remult"

@Entity("products", {
    allowApiCrud: true
})
export class Product {
    @Fields.autoIncrement()
    id = 0

    @Fields.string()
    name = ''

    @Fields.string()
    description = ''

    @Fields.string()
    category = ''

    @Fields.number()
    price = 0

    @Fields.boolean()
    inStock = true
}
