import { Module } from "@nestjs/common";
import { DatabaseModule } from "./config/database";
import { HealthController } from "./common/health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { UploadModule } from "./modules/upload/upload.module";
import { LocalModule } from "./modules/local/local.module";
import { AccommodationModule } from "./modules/accommodation/accommodation.module";
import { RestaurantModule } from "./modules/restaurant/restaurant.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { EventModule } from "./modules/event/event.module";
import { ItineraryModule } from "./modules/itinerary/itinerary.module";
import { ReviewModule } from "./modules/review/review.module";
import { FavoriteModule } from "./modules/favorite/favorite.module";
import { SustainabilityModule } from "./modules/sustainability/sustainability.module";
import { SuggestionModule } from "./modules/suggestion/suggestion.module";
import { BalneabilityModule } from "./modules/balneability/balneability.module";
import { AdminModule } from "./modules/admin/admin.module";
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    UploadModule,
    LocalModule,
    AccommodationModule,
    RestaurantModule,
    ActivityModule,
    EventModule,
    ItineraryModule,
    ReviewModule,
    FavoriteModule,
    SustainabilityModule,
    SuggestionModule,
    BalneabilityModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
