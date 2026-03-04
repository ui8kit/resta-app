import type { ChangeEvent, FormEvent, RefObject } from 'react';

/** Ref for a file input element. Used by AdminDashboardPageView for import. */
export type FileInputRef = RefObject<HTMLInputElement | null>;

/** Handler for file input change events. Used by AdminDashboardPageView for import. */
export type FileChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void;

/** Handler for form submit events. Used by AdminLoginPageView for login form. */
export type FormSubmitHandler = (e: FormEvent) => void;
