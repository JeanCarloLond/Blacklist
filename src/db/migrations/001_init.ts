import type { Migration } from './types';

/**
 * Esquema inicial de BlackList.
 *
 * Dos criterios que se repiten por todo el esquema:
 *
 * 1. **Los enums se validan con `CHECK`.** Cuesta una línea y evita que un bug
 *    de la app meta un `priority: 7` que luego reviente al pintar. La base es la
 *    última línea de defensa del modelo.
 * 2. **Borrado suave (`archived_at`) en tareas y metas.** Borrar de verdad una
 *    meta destruiría su historial de constancia, que es justo lo que la app
 *    existe para conservar.
 */
const up = `
CREATE TABLE categories (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  icon        TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE tasks (
  id                      TEXT PRIMARY KEY NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  category_id             TEXT REFERENCES categories(id) ON DELETE SET NULL,
  priority                INTEGER NOT NULL DEFAULT 1 CHECK (priority IN (0, 1, 2)),
  due_date                TEXT,
  due_time                TEXT,
  recurrence_type         TEXT NOT NULL DEFAULT 'none'
                          CHECK (recurrence_type IN ('none','daily','weekdays','weekly','monthly')),
  recurrence_days         TEXT,
  recurrence_day_of_month INTEGER CHECK (recurrence_day_of_month BETWEEN 1 AND 31),
  completed_at            TEXT,
  archived_at             TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);

-- La vista de "hoy" filtra por fecha entre tareas vivas: el índice parcial
-- excluye las archivadas, que nunca aparecen en esa consulta.
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE archived_at IS NULL;
CREATE INDEX idx_tasks_recurrence ON tasks(recurrence_type) WHERE archived_at IS NULL;
CREATE INDEX idx_tasks_category ON tasks(category_id);

CREATE TABLE subtasks (
  id       TEXT PRIMARY KEY NOT NULL,
  task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id, position);

CREATE TABLE goals (
  id             TEXT PRIMARY KEY NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  category_id    TEXT REFERENCES categories(id) ON DELETE SET NULL,
  color          TEXT,
  icon           TEXT,
  kind           TEXT NOT NULL DEFAULT 'boolean' CHECK (kind IN ('boolean','quantitative')),
  target_value   REAL CHECK (target_value IS NULL OR target_value > 0),
  unit           TEXT,
  schedule_type  TEXT NOT NULL DEFAULT 'daily'
                 CHECK (schedule_type IN ('daily','weekdays','times_per_week')),
  schedule_days  TEXT,
  times_per_week INTEGER CHECK (times_per_week IS NULL OR times_per_week BETWEEN 1 AND 7),
  started_at     TEXT NOT NULL,
  archived_at    TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,

  -- Una meta cuantitativa sin objetivo no se puede evaluar, y una booleana con
  -- objetivo confunde la interfaz. La base impide ambas combinaciones.
  CHECK (
    (kind = 'quantitative' AND target_value IS NOT NULL) OR
    (kind = 'boolean' AND target_value IS NULL)
  )
);

CREATE INDEX idx_goals_active ON goals(archived_at);

-- Registro unificado de cumplimiento: la pieza central de la app.
-- Tareas y metas comparten tabla para que el heatmap general sea un GROUP BY
-- y no un UNION de dos tablas en cada render.
CREATE TABLE completion_log (
  id          TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task','goal')),
  entity_id   TEXT NOT NULL,
  day         TEXT NOT NULL,
  value       REAL NOT NULL DEFAULT 1 CHECK (value >= 0),
  note        TEXT,
  created_at  TEXT NOT NULL,

  -- Un cumplimiento por entidad y día. Marcar dos veces el mismo día actualiza
  -- la fila, nunca crea una segunda: si no, la racha contaría de más.
  UNIQUE (entity_type, entity_id, day)
);

CREATE INDEX idx_completion_day ON completion_log(day);
CREATE INDEX idx_completion_entity_day ON completion_log(entity_type, entity_id, day);

CREATE TABLE reminders (
  id              TEXT PRIMARY KEY NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  time            TEXT NOT NULL,
  repeat_type     TEXT NOT NULL DEFAULT 'once'
                  CHECK (repeat_type IN ('once','daily','weekly')),
  repeat_days     TEXT,
  date            TEXT,
  linked_type     TEXT CHECK (linked_type IS NULL OR linked_type IN ('task','goal')),
  linked_id       TEXT,
  -- Identificador que devuelve expo-notifications al programar el aviso. Se
  -- guarda para poder cancelarlo o reprogramarlo después.
  notification_id TEXT,
  enabled         INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  snoozed_until   TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_reminders_enabled ON reminders(enabled);

-- Fila única con el estado de gamificación. La racha global se cachea aquí
-- para pintar Home rápido, pero la fuente de verdad siempre es completion_log:
-- un contador almacenado se desincroniza, un cálculo derivado no.
CREATE TABLE user_stats (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  xp                    INTEGER NOT NULL DEFAULT 0,
  level                 INTEGER NOT NULL DEFAULT 1,
  total_completed       INTEGER NOT NULL DEFAULT 0,
  global_current_streak INTEGER NOT NULL DEFAULT 0,
  global_best_streak    INTEGER NOT NULL DEFAULT 0,
  last_active_day       TEXT
);

CREATE TABLE achievements (
  code        TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  unlocked_at TEXT NOT NULL
);

CREATE TABLE app_meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT INTO user_stats (id) VALUES (1);

-- Categorías de arranque: sin ninguna, la primera pantalla de creación de tarea
-- obliga a inventarse una taxonomía antes de poder apuntar nada. Son editables
-- y borrables como cualquier otra.
INSERT INTO categories (id, name, color, icon, position, created_at) VALUES
  ('cat_personal',     'Personal',     '#6D5AE6', 'person-outline',    0, datetime('now')),
  ('cat_trabajo',      'Trabajo',      '#2E6FD9', 'briefcase-outline', 1, datetime('now')),
  ('cat_universidad',  'Universidad',  '#F79009', 'school-outline',    2, datetime('now')),
  ('cat_salud',        'Salud',        '#12B76A', 'fitness-outline',   3, datetime('now')),
  ('cat_aprender',     'Aprender',     '#D6409F', 'book-outline',      4, datetime('now'));
`;

export const migration001: Migration = {
  version: 1,
  name: 'init',
  up,
};
