import { createZodDto } from "nestjs-zod";

import { SearchInput } from "../search.schema";

export class MessageInputDto extends createZodDto(SearchInput) {}
