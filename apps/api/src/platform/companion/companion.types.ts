/**
 * Shared types for the companion module.
 *
 * Kept in a separate file so both the service and controller can import
 * them without creating a circular dependency.
 */

export interface UpdateChecklistInput {
  commissionsDone?:    boolean;
  teapotClaimed?:      boolean;
  transformerClaimed?: boolean;
}
