use mongodb::{
    bson::{doc, Document},
    Client, Collection,
};
use solana_program::pubkey::Pubkey;
use crate::models::marketplace_item::MarketplaceItem;
use std::str::FromStr;

pub struct MarketplaceItemRepository {
    collection: Collection<Document>,
}

impl MarketplaceItemRepository {
    pub async fn new(connection_string: &str, database: &str, collection_name: &str) -> Self {
        let client = Client::with_uri_str(connection_string).await.unwrap();
        let database = client.database(database);
        let collection = database.collection(collection_name);
        MarketplaceItemRepository { collection }
    }

    pub async fn save(&self, item: &MarketplaceItem) -> mongodb::error::Result<String> {
        let doc = doc! {
            "is_initialized": item.is_initialized,
            "seller": item.seller.to_string(),
            "price": item.price,
            "is_active": item.is_active,
        };
        let result = self.collection.insert_one(doc, None).await?;
        Ok(result.inserted_id.as_object_id().unwrap().to_hex())
    }

    pub async fn find_by_seller(&self, seller: &Pubkey) -> mongodb::error::Result<Vec<MarketplaceItem>> {
        let filter = doc! { "seller": seller.to_string() };
        let cursor = self.collection.find(filter, None).await?;
        let items: Vec<MarketplaceItem> = cursor
            .map(|doc| {
                let doc = doc.unwrap();
                MarketplaceItem {
                    is_initialized: doc.get_bool("is_initialized").unwrap_or(false),
                    seller: Pubkey::from_str(doc.get_str("seller").unwrap()).unwrap(),
                    price: doc.get_i64("price").unwrap_or(0) as u64,
                    is_active: doc.get_bool("is_active").unwrap_or(false),
                }
            })
            .collect::<Vec<_>>()
            .await;
        Ok(items)
    }

    pub async fn update(&self, id: &str, item: &MarketplaceItem) -> mongodb::error::Result<()> {
        let filter = doc! { "_id": id };
        let update = doc! {
            "$set": {
                "is_initialized": item.is_initialized,
                "seller": item.seller.to_string(),
                "price": item.price,
                "is_active": item.is_active,
            }
        };
        self.collection.update_one(filter, update, None).await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> mongodb::error::Result<()> {
        let filter = doc! { "_id": id };
        self.collection.delete_one(filter, None).await?;
        Ok(())
    }

    pub async fn delete_all(&self) -> mongodb::error::Result<u64> {
        let result = self.collection.delete_many(doc! {}, None).await?;
        Ok(result.deleted_count)
    }
}