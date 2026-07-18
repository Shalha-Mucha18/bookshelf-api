export interface Review {
  uid: string;
  rating: number;
  review_text: string;
  user_uid: string | null;
  book_uid: string | null;
  created_at: string;
  update_at: string;
}

export interface Book {
  uid: string;
  title: string;
  author: string;
  publisher: string;
  published_date: string;
  page_count: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface BookDetails extends Book {
  reviews: Review[];
  tags?: Tag[];
}

export interface BookCreate {
  title: string;
  author: string;
  publisher: string;
  published_date: string;
  page_count: number;
  language: string;
}

export interface Tag {
  uid: string;
  name: string;
  created_at: string;
}

export interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface UserWithBooks extends User {
  books: Book[];
  reviews: Review[];
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: { email: string; uid: string };
}
