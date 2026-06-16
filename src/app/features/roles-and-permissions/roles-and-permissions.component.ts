import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

type RolesAndPermissionsLocale = 'en' | 'es';

type RoleCopy = {
  title: string;
  description: string;
  contentInteraction: {
    title: string;
    can: string[];
    cant: string[];
  };
  collaboration: {
    title: string;
    can?: string[];
    cant?: string[];
  };
};

type ContentInteractionTableCellLine = {
  context: string | null;
  text: string;
};

type ContentInteractionTableCell = ContentInteractionTableCellLine[];

type CollaborationTableRow = {
  entity: string;
  grantAnyRole: { text: string };
  grantMemberOrGuestRole: { text: string };
};

type ContentInteractionTableRow = {
  entity: string;
  creation: ContentInteractionTableCell;
  update: ContentInteractionTableCell;
  deletion: ContentInteractionTableCell;
};

type RolesAndPermissionsCopy = {
  languageLinks: Record<string, string>;
  heading: string;
  intro: string;
  labels: Record<string, string>;
  roles: {
    superAdmin: RoleCopy;
    admin: RoleCopy;
    member: RoleCopy;
    guest: RoleCopy;
  };
  supportingSections: {
    granular: {
      title: string;
      description: string;
    };
    creators: {
      title: string;
      intro: string;
      permissions: string[];
    };
    permissionsInheritance: {
      title: string;
      paragraphs: string[];
    };
  };
  tables: {
    contentInteraction: {
      title: string;
      headers: {
        creation: string;
        update: string;
        deletion: string;
      };
      rows: ContentInteractionTableRow[];
    };
    collaboration: {
      title: string;
      headers: {
        grantAnyRole: string;
        grantMemberOrGuestRole: string;
      };
      rows: CollaborationTableRow[];
    };
  };
};

const rolesAndPermissionsCopyByLocale = {
  en: {
    languageLinks: {
      english: 'EN',
      spanish: 'ES',
    },
    heading: 'Roles & Permissions',
    intro:
      'This app uses a simplified version of the permissions used on ClickUp. There are 4 main roles:',
    labels: {
      can: 'CAN',
      cant: "CAN'T",
    },
    roles: {
      superAdmin: {
        title: 'Super admin',
        description:
          'Super admin is the role with the highest permissions in this app. This permission gets automatically granted when creating a Workspace.',
        contentInteraction: {
          title: 'Content interaction',
          can: [
            'Create, view, edit, and delete the entity or sections and Tasks inside.',
          ],
          cant: [
            "Delete a Workspace if they're not super admins of at least another workspace.",
          ],
        },
        collaboration: {
          title: 'Collaboration',
          can: [
            'Invite and remove users and modify roles for all users in the section or the sections inside, and assign Tasks to other users.',
          ],
        },
      },
      admin: {
        title: 'Admin',
        description:
          'Admins are trusted users who are granted most permissions in a section.',
        contentInteraction: {
          title: 'Content interaction',
          can: [
            'Create, view, and edit the section, child sections, List Statuses and Tasks inside.',
            "Delete the section if it's a Folder or a List.",
            'Delete Folders, Lists, List Statuses and Tasks inside.',
          ],
          cant: [
            "Delete the section itself if it is a Workspace or a Space. If they are admins of a Workspace, they also can't delete the Spaces within that Workspace.",
          ],
        },
        collaboration: {
          title: 'Collaboration',
          can: [
            'Invite new users as members or guests to the section and the child sections',
            'Make members guests and guests members in the section and child sections',
            'Remove members or guests in the section and child sections.',
            'Assign Tasks and remove assignments.',
          ],
          cant: [
            'Invite new users as admins or super admins to the section.',
            'Make other users admins or super admins in the section.',
            'Lower the permissions of other admins or super admins in the section.',
            'Remove other admins or super admins from the section.',
          ],
        },
      },
      member: {
        title: 'Member',
        description:
          'Members are standard users who actively work within a section.',
        contentInteraction: {
          title: 'Content interaction',
          can: [
            'View and create sections and Tasks inside the section.',
            "Rename Spaces, Folders, Lists they create if they're a member of them and those they create inside of all sections they're a member of.",
            'Update any feature in all Tasks they created inside the entity.',
            'Update description and status in all Tasks inside the entity.',
            "Delete Lists and Tasks they've created.",
          ],
          cant: [
            'Rename the section, except for those created by them.',
            'Rename the content inside, except that created by them.',
            "Delete the entity or the content inside, except if it's a List or a Task created by them.",
            'Create, update or delete List Statuses.',
          ],
        },
        collaboration: {
          title: 'Collaboration',
          cant: [
            'Alter user roles or invite new users to the section or the sections inside.',
            'Assign Tasks to users, or remove assignments.',
          ],
        },
      },
      guest: {
        title: 'Guest',
        description:
          'Guests are external or temporary collaborators with restricted access to a section.',
        contentInteraction: {
          title: 'Content interaction',
          can: [
            'View content and modify the status of Tasks inside the entity.',
          ],
          cant: [
            'Create, update or delete sections and Tasks aside from updating a task status.',
          ],
        },
        collaboration: {
          title: 'Collaboration',
          cant: [
            'Alter user roles or invite new users to the section or the sections inside.',
            'Assign Tasks to users, or remove assignments.',
          ],
        },
      },
    },
    supportingSections: {
      granular: {
        title: 'Granular',
        description:
          "This is a system-derived role to indicate that a user has permissions in at least one of the entities inside the workspace, but not the workspace itself, so users can't see every entity that there's within unless they are given explicit permissions.",
      },
      creators: {
        title: 'Creators',
        intro: 'All super admins, admins and members can:',
        permissions: [
          'Update Spaces, Folders, Lists, and List Statuses they created.',
          "Update name, priority, due date and assignee in all Tasks they created inside the sections they're part of.",
          'Delete Lists, List Statuses and Tasks they created.',
        ],
      },
      permissionsInheritance: {
        title: 'Permissions inheritance',
        paragraphs: [
          'When admin, member, or guest permissions are granted at a top level, the user automatically receives the same permission for all the subordinate sections.',
          'Users cannot have lower access permissions on a sub-section than they have at a higher level; for example, a member of a Space cannot be reassigned as merely a guest of one of its lists.',
          'However, the opposite is possible: a user who is a guest in a Workspace can still be designated as an admin of a List within it.',
          'This design ensures a consistent hierarchical structure.',
        ],
      },
    },
    tables: {
      contentInteraction: {
        title: 'Content interaction',
        headers: {
          creation: 'Creation',
          update: 'Update',
          deletion: 'Deletion',
        },
        rows: [
          {
            entity: 'Workspace',
            creation: [{ context: null, text: 'Any user' }],
            update: [{ context: null, text: 'Super admin, admin' }],
            deletion: [{ context: null, text: 'Super admin' }],
          },
          {
            entity: 'Space',
            creation: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin, member',
              },
            ],
            update: [
              {
                context: '(Of parent)',
                text: "Super admin, admin, member if they're the creator of the space",
              },
              {
                context: null,
                text: 'Super admin, admin, member creator',
              },
            ],
            deletion: [
              {
                context: '(Of parent)',
                text: 'Super admin',
              },
              {
                context: null,
                text: 'Super admin',
              },
            ],
          },
          {
            entity: 'Folder',
            creation: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin, member',
              },
            ],
            update: [
              {
                context: '(Of parent)',
                text: "Super admin, admin, member if they're the creator of the folder",
              },
              {
                context: null,
                text: 'Super admin, admin, member creator',
              },
            ],
            deletion: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin',
              },
              {
                context: null,
                text: 'Super admin, admin',
              },
            ],
          },
          {
            entity: 'List',
            creation: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin, member',
              },
            ],
            update: [
              {
                context: '(Of parent)',
                text: "Super admin, admin, member if they're the creator of the list",
              },
              {
                context: null,
                text: 'Super admin, admin, member creator',
              },
            ],
            deletion: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin',
              },
              {
                context: null,
                text: 'Super admin, admin, member creators',
              },
            ],
          },
          {
            entity: 'Statuses',
            creation: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin',
              },
            ],
            update: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin',
              },
            ],
            deletion: [
              {
                context: '(Of parent)',
                text: 'Super admin, admin',
              },
            ],
          },
          {
            entity: 'Tasks',
            creation: [
              {
                context: '(Of parent, all features)',
                text: 'Super admin, admin, member',
              },
            ],
            update: [
              {
                context: '(Of parent)',
                text: "Priority, due date, assignee: Super admin, admin, member if they're the creator of the task",
              },
              {
                context: null,
                text: 'Super admin, admin, member',
              },
              {
                context: null,
                text: 'Super admin, admin, member, guest',
              },
            ],
            deletion: [
              {
                context: '(Of parent)',
                text: "Super admin, admin, member if they're the creator of the task",
              },
            ],
          },
        ],
      },
      collaboration: {
        title: 'Collaboration',
        headers: {
          grantAnyRole:
            'Grant or delete any role in the section or the sections inside',
          grantMemberOrGuestRole:
            'Grant or delete member or guest role in the section or the sections inside',
        },
        rows: [
          {
            entity: 'Workspace',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'Space',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'Folder',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'List',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
        ],
      },
    },
  },
  es: {
    languageLinks: {
      english: 'EN',
      spanish: 'ES',
    },
    heading: 'Roles y permisos',
    intro:
      'Esta aplicación utiliza una versión simplificada de los permisos usados en ClickUp. Hay 4 roles principales:',
    labels: {
      can: 'PUEDE',
      cant: 'NO PUEDE',
    },
    roles: {
      superAdmin: {
        title: 'Super admin',
        description:
          'Super admin es el rol con más permisos de la aplicación. Este permiso se concede automáticamente al crear un Espacio de trabajo.',
        contentInteraction: {
          title: 'Interacción con el contenido',
          can: [
            'Crear, ver, editar y eliminar la entidad o las secciones y Tareas dentro de ella.',
          ],
          cant: [
            'Eliminar un Espacio de trabajo si no es super admin de al menos otro Espacio de trabajo.',
          ],
        },
        collaboration: {
          title: 'Colaboración',
          can: [
            'Invitar y eliminar usuarios, modificar roles para todos los usuarios de la sección o de las secciones dentro de ella, y asignar Tareas a otros usuarios.',
          ],
        },
      },
      admin: {
        title: 'Admin',
        description:
          'Los admins son usuarios de confianza a los que se les concede la mayoría de los permisos en una sección.',
        contentInteraction: {
          title: 'Interacción con el contenido',
          can: [
            'Crear, ver y editar la sección, las Listas internas, los Estados de Listas y las Tareas dentro de ella.',
            'Eliminar la sección si es una Carpeta o una Lista.',
            'Eliminar Carpetas, Listas, Estados de Listass y Tareas dentro de ella.',
          ],
          cant: [
            'Eliminar la propia sección si es un Espacio de trabajo o un Espacio. Si son admins de un Espacio de trabajo, tampoco pueden eliminar los Espacios dentro de ese Espacio de trabajo.',
          ],
        },
        collaboration: {
          title: 'Colaboración',
          can: [
            'Invitar nuevos usuarios como miembros o invitados a la sección y a las Listas internas.',
            'Convertir miembros en invitados e invitados en miembros dentro de la sección y de las Listas internas.',
            'Eliminar miembros o invitados en la sección y en las Listas internas.',
            'Asignar Tareas y quitar asignaciones.',
          ],
          cant: [
            'Invitar nuevos usuarios como admins o super admins a la sección.',
            'Convertir a otros usuarios en admins o super admins dentro de la sección.',
            'Reducir los permisos de otros admins o super admins dentro de la sección.',
            'Eliminar a otros admins o super admins de la sección.',
          ],
        },
      },
      member: {
        title: 'Miembro',
        description:
          'Los miembros son usuarios estándar que trabajan activamente dentro de una sección.',
        contentInteraction: {
          title: 'Interacción con el contenido',
          can: [
            'Ver y crear secciones y Tareas dentro de la sección.',
            'Renombrar los Espacios, Carpetas y Listas que hayan creado, siempre que sean miembros de ellas, así como las que creen dentro de cualquier sección de la que formen parte.',
            'Actualizar cualquier propiedad de todas las Tareas que hayan creado dentro de la entidad.',
            'Actualizar la descripción y el estado de todas las Tareas dentro de la entidad.',
            'Eliminar las Listas y Tareas que hayan creado.',
          ],
          cant: [
            'Renombrar la sección, excepto aquellas creadas por ellos.',
            'Renombrar el contenido interno, excepto aquel creado por ellos.',
            'Eliminar la entidad o el contenido dentro de ella, salvo si es una Lista o una Tarea creada por ellos.',
            'Crear, actualizar o eliminar Estados de Listas.',
          ],
        },
        collaboration: {
          title: 'Colaboración',
          cant: [
            'Modificar roles de usuario o invitar nuevos usuarios a la sección o a las secciones dentro de ella.',
            'Asignar Tareas a usuarios o eliminar asignaciones.',
          ],
        },
      },
      guest: {
        title: 'Invitado',
        description:
          'Los invitados son colaboradores externos o temporales con acceso restringido a una sección.',
        contentInteraction: {
          title: 'Interacción con el contenido',
          can: [
            'Ver el contenido y modificar el estado de las Tareas dentro de la entidad.',
          ],
          cant: [
            'Crear, actualizar o eliminar secciones y Tareas, salvo la actualización del estado de una Tarea.',
          ],
        },
        collaboration: {
          title: 'Colaboración',
          cant: [
            'Modificar roles de usuario o invitar nuevos usuarios a la sección o a las secciones dentro de ella.',
            'Asignar Tareas a usuarios o eliminar asignaciones.',
          ],
        },
      },
    },
    supportingSections: {
      granular: {
        title: 'Granular',
        description:
          'Este es un rol derivado del sistema que indica que un usuario tiene permisos en al menos una de las entidades dentro del Espacio de trabajo, pero no en el propio Espacio de trabajo, por lo que no puede ver todas las entidades que contiene a menos que se le otorguen permisos explícitos.',
      },
      creators: {
        title: 'Creadores',
        intro: 'Todos los super admins, admins y miembros pueden:',
        permissions: [
          'Actualizar los Espacios, Carpetas, Listas y Estados de Listas que hayan creado.',
          'Actualizar el nombre, la prioridad, la fecha de vencimiento y el responsable en todas las Tareas que hayan creado dentro de las secciones de las que forman parte.',
          'Eliminar las Listas, los Estados de Listas y las Tareas que hayan creado.',
        ],
      },
      permissionsInheritance: {
        title: 'Herencia de permisos',
        paragraphs: [
          'Cuando se conceden permisos de admin, miembro o invitado en un nivel superior, el usuario recibe automáticamente el mismo permiso en todas las secciones subordinadas.',
          'Los usuarios no pueden tener permisos de acceso inferiores en una subsección a los que tienen en un nivel superior; por ejemplo, un miembro de un Espacio no puede ser reasignado como simple invitado de una de sus Listas.',
          'Sin embargo, sí es posible lo contrario: un usuario que es invitado en un Espacio de trabajo puede seguir siendo designado como admin de una Lista dentro de él.',
          'Este diseño garantiza una estructura jerárquica coherente.',
        ],
      },
    },
    tables: {
      contentInteraction: {
        title: 'Interacción con el contenido',
        headers: {
          creation: 'Creación',
          update: 'Actualización',
          deletion: 'Eliminación',
        },
        rows: [
          {
            entity: 'Espacio de trabajo',
            creation: [{ context: null, text: 'Cualquier usuario' }],
            update: [{ context: null, text: 'Super admin, admin' }],
            deletion: [{ context: null, text: 'Super admin' }],
          },
          {
            entity: 'Espacio',
            creation: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro',
              },
            ],
            update: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro si es el creador del espacio',
              },
              {
                context: null,
                text: 'Super admin, admin, miembro creador',
              },
            ],
            deletion: [
              {
                context: '(De la sección superior)',
                text: 'Super admin',
              },
              {
                context: null,
                text: 'Super admin',
              },
            ],
          },
          {
            entity: 'Carpeta',
            creation: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro',
              },
            ],
            update: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro si es el creador de la carpeta',
              },
              {
                context: null,
                text: 'Super admin, admin, miembro creador',
              },
            ],
            deletion: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin',
              },
              {
                context: null,
                text: 'Super admin, admin',
              },
            ],
          },
          {
            entity: 'Lista',
            creation: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro',
              },
            ],
            update: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro si es el creador de la lista',
              },
              {
                context: null,
                text: 'Super admin, admin, miembro creador',
              },
            ],
            deletion: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin',
              },
              {
                context: null,
                text: 'Super admin, admin, miembros creadores',
              },
            ],
          },
          {
            entity: 'Estado',
            creation: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin',
              },
            ],
            update: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin',
              },
            ],
            deletion: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin',
              },
            ],
          },
          {
            entity: 'Tarea',
            creation: [
              {
                context: '(De la sección superior, todas las funciones)',
                text: 'Super admin, admin, miembro',
              },
            ],
            update: [
              {
                context: '(De la sección superior)',
                text: 'Prioridad, fecha de vencimiento, responsable: Super admin, admin, miembro si es el creador de la Tarea',
              },
              {
                context: null,
                text: 'Super admin, admin, miembro',
              },
              {
                context: null,
                text: 'Super admin, admin, miembro, invitado',
              },
            ],
            deletion: [
              {
                context: '(De la sección superior)',
                text: 'Super admin, admin, miembro si es el creador de la Tarea',
              },
            ],
          },
        ],
      },
      collaboration: {
        title: 'Colaboración',
        headers: {
          grantAnyRole:
            'Conceder o eliminar cualquier rol en la sección o en las secciones dentro de ella',
          grantMemberOrGuestRole:
            'Conceder o eliminar el rol de miembro o invitado en la sección o en las secciones dentro de ella',
        },
        rows: [
          {
            entity: 'Espacio de trabajo',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'Espacio',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'Carpeta',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
          {
            entity: 'Lista',
            grantAnyRole: { text: 'Super admin' },
            grantMemberOrGuestRole: { text: 'Super admin, admin' },
          },
        ],
      },
    },
  },
} satisfies Record<RolesAndPermissionsLocale, RolesAndPermissionsCopy>;

@Component({
  selector: 'app-roles-and-permissions',
  imports: [RouterLink],
  templateUrl: './roles-and-permissions.component.html',
  styleUrl: './roles-and-permissions.component.css',
})
export class RolesAndPermissionsComponent {
  protected lang = input<string>();
  protected currentLanguage = computed<'en' | 'es'>(() =>
    this.lang() === 'es' ? 'es' : 'en',
  );
  protected currentCopy = computed(
    () => rolesAndPermissionsCopyByLocale[this.currentLanguage()],
  );
}
