"use client";

import { Card, PageTitle } from "../components/ui";
import { useLanguage } from "../lib/i18n";

export type LegalDocument = "legal" | "privacy" | "terms";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type DocumentCopy = {
  eyebrow: string;
  title: string;
  introduction: string;
  notice: string;
  sections: Section[];
};

const documents: Record<"fr" | "en", Record<LegalDocument, DocumentCopy>> = {
  fr: {
    legal: {
      eyebrow: "INFORMATIONS LÉGALES",
      title: "MENTIONS LÉGALES",
      introduction:
        "Informations relatives à l’édition, à l’hébergement et à la propriété intellectuelle de Pinkward.",
      notice:
        "Version de développement local. L’identité juridique, l’adresse, le directeur de publication et l’hébergeur de production doivent être complétés avant toute ouverture publique.",
      sections: [
        {
          title: "Éditeur du service",
          paragraphs: [
            "Pinkward est actuellement un projet communautaire en développement local. L’éditeur légal, sa forme juridique, son adresse, ses coordonnées et, le cas échéant, son numéro d’immatriculation restent à renseigner avant la mise en production.",
          ],
        },
        {
          title: "Direction de la publication",
          paragraphs: [
            "Le nom du directeur ou de la directrice de publication doit être ajouté lorsque l’entité responsable du service sera constituée ou identifiée.",
          ],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Cette version est exécutée localement dans une infrastructure Docker accessible uniquement en loopback. Le nom, l’adresse et les coordonnées de l’hébergeur devront être publiés avant un déploiement accessible au public.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Une adresse de contact dédiée à l’éditeur et aux demandes relatives aux données personnelles doit être renseignée avant la publication du service.",
          ],
        },
        {
          title: "Propriété intellectuelle et marques tierces",
          paragraphs: [
            "Les éléments propres à Pinkward sont protégés selon les droits applicables. League of Legends, Riot Games et leurs éléments graphiques appartiennent à leurs titulaires respectifs.",
            "Pinkward est un projet communautaire indépendant, non approuvé, non sponsorisé et non affilié à Riot Games.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "Le service est encore en développement. Son fonctionnement, ses données de test et sa disponibilité peuvent évoluer. Les informations de cette page devront être revues par le responsable du projet avant une exploitation publique.",
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "DONNÉES PERSONNELLES",
      title: "POLITIQUE DE CONFIDENTIALITÉ",
      introduction:
        "Cette page décrit les données utilisées par Pinkward et le fonctionnement actuel de la version locale.",
      notice:
        "Cette politique décrit l’implémentation actuelle. Le responsable du traitement, les bases légales et les durées définitives devront être formalisés avant la mise en production.",
      sections: [
        {
          title: "Données traitées",
          items: [
            "Identifiant technique OAuth, pseudo Showdown et statut de session.",
            "Région, préférences de file et, lorsque l’utilisateur le lie volontairement, Riot ID, icône et niveau.",
            "Groupes, invitations, présence, recherches, matchs, résultats, historique et évaluations MMR.",
            "État du Watcher et résultats vérifiés des objectifs 1v1.",
            "Journaux techniques nécessaires à la sécurité, au diagnostic et à la limitation des abus.",
          ],
        },
        {
          title: "Finalités",
          items: [
            "Authentifier le joueur et sécuriser sa session.",
            "Fournir les profils, groupes, files, matchs, classements et historiques.",
            "Vérifier les objectifs des duels et calculer les évaluations compétitives.",
            "Prévenir les abus, diagnostiquer les erreurs et maintenir la sécurité du service.",
          ],
        },
        {
          title: "Stockage local et cookies",
          paragraphs: [
            "Le jeton d’accès reste limité à la session de l’onglet. Le jeton de rafraîchissement est conservé dans un cookie HttpOnly restreint aux routes de session. Un cookie essentiel mémorise la langue et le stockage local mémorise uniquement des préférences d’interface et l’état de déconnexion.",
            "Aucun outil publicitaire ou de suivi d’audience tiers n’est actuellement intégré.",
          ],
        },
        {
          title: "Watcher et client League",
          paragraphs: [
            "Le Watcher fonctionne sur l’ordinateur du joueur. Les secrets LCU ne sont pas envoyés au navigateur ni au backend. Seules les informations nécessaires à la liaison du Riot ID, à l’état du duel et au résultat vérifié sont transmises.",
          ],
        },
        {
          title: "Destinataires et sécurité",
          paragraphs: [
            "Dans la version locale, les données circulent uniquement entre les services Pinkward nécessaires au fonctionnement. Les accès sont protégés par OAuth2/OIDC, JWT et des contrôles de périmètre. Pinkward ne vend pas les données des joueurs.",
          ],
        },
        {
          title: "Durées de conservation",
          paragraphs: [
            "Dans l’environnement de développement, les données restent présentes jusqu’à leur suppression ou à la réinitialisation des bases locales. Un calendrier de conservation adapté à chaque finalité doit être adopté et publié avant la production.",
          ],
        },
        {
          title: "Droits des personnes",
          paragraphs: [
            "Selon le contexte juridique applicable, les utilisateurs peuvent disposer de droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Une procédure de contact et de réponse doit être publiée avant l’ouverture du service.",
            "En France, une réclamation peut être adressée à la CNIL lorsque les conditions sont réunies.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "RÈGLES DU SERVICE",
      title: "CONDITIONS D’UTILISATION",
      introduction:
        "Règles essentielles applicables à l’utilisation des fonctionnalités compétitives de Pinkward.",
      notice:
        "Projet en développement : ces conditions constituent une base fonctionnelle et devront être validées et complétées avant l’ouverture au public.",
      sections: [
        {
          title: "Compte et accès",
          paragraphs: [
            "L’utilisateur est responsable de l’accès à son compte local et de l’exactitude des informations qu’il choisit de fournir. Il ne doit pas utiliser le compte ou le Riot ID d’un tiers sans autorisation.",
          ],
        },
        {
          title: "Intégrité compétitive",
          items: [
            "Ne pas falsifier un résultat, une identité ou un état de partie.",
            "Ne pas contourner le Watcher, l’authentification ou les contrôles de sécurité.",
            "Ne pas exploiter un bug, automatiser abusivement les requêtes ou perturber les autres joueurs.",
            "Les bots sont réservés aux scénarios de test explicitement activés.",
          ],
        },
        {
          title: "Matchs, résultats et classement",
          paragraphs: [
            "Les évaluations TrueSkill 5v5 et Glicko-2 1v1 dépendent des résultats validés par le serveur. Une partie peut être annulée ou exclue du classement lorsqu’elle est incomplète, incohérente ou non vérifiable.",
          ],
        },
        {
          title: "Watcher local",
          paragraphs: [
            "Le Watcher est limité à l’automatisation et à la vérification des parties personnalisées prévues par Pinkward. Il ne doit pas être modifié ou utilisé pour obtenir un avantage en jeu.",
          ],
        },
        {
          title: "Disponibilité et évolution",
          paragraphs: [
            "Cette version est fournie à des fins de développement et de test. Les fonctionnalités, règles de classement, saisons et données locales peuvent être corrigées, réinitialisées ou rendues temporairement indisponibles.",
          ],
        },
        {
          title: "Suspension",
          paragraphs: [
            "Un accès peut être limité ou suspendu en cas d’abus, de fraude, d’atteinte à la sécurité ou de violation répétée de ces règles.",
          ],
        },
        {
          title: "Droit applicable",
          paragraphs: [
            "Le droit applicable, les modalités de règlement des différends et les coordonnées du responsable devront être précisés avant la mise en production.",
          ],
        },
      ],
    },
  },
  en: {
    legal: {
      eyebrow: "LEGAL INFORMATION",
      title: "LEGAL NOTICE",
      introduction:
        "Information about Pinkward’s publisher, hosting and intellectual property.",
      notice:
        "Local development version. The legal entity, address, publication director and production host must be completed before any public launch.",
      sections: [
        {
          title: "Service publisher",
          paragraphs: [
            "Pinkward is currently a community project under local development. The legal publisher, legal form, address, contact details and registration number, where applicable, must be provided before production.",
          ],
        },
        {
          title: "Publication director",
          paragraphs: [
            "The publication director’s name must be added once the entity responsible for the service has been established or identified.",
          ],
        },
        {
          title: "Hosting",
          paragraphs: [
            "This version runs locally in a loopback-only Docker environment. The production hosting provider’s name, address and contact details must be published before public deployment.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "A dedicated publisher and data-protection contact address must be provided before the service is published.",
          ],
        },
        {
          title: "Intellectual property and third-party marks",
          paragraphs: [
            "Pinkward-specific materials are protected under applicable rights. League of Legends, Riot Games and their visual assets belong to their respective owners.",
            "Pinkward is an independent community project and is not endorsed, sponsored by or affiliated with Riot Games.",
          ],
        },
        {
          title: "Liability",
          paragraphs: [
            "The service is still under development. Its operation, test data and availability may change. This page must be reviewed by the project owner before public operation.",
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "PERSONAL DATA",
      title: "PRIVACY POLICY",
      introduction:
        "This page describes the data used by Pinkward and the current local version’s operation.",
      notice:
        "This policy describes the current implementation. The controller, legal bases and final retention periods must be formalised before production.",
      sections: [
        {
          title: "Data processed",
          items: [
            "OAuth technical identifier, Showdown display name and session status.",
            "Region, queue preferences and, when voluntarily linked, Riot ID, icon and level.",
            "Parties, invitations, presence, searches, matches, results, history and MMR ratings.",
            "Watcher status and verified 1v1 objective results.",
            "Technical logs required for security, diagnostics and abuse prevention.",
          ],
        },
        {
          title: "Purposes",
          items: [
            "Authenticate the player and secure their session.",
            "Provide profiles, parties, queues, matches, leaderboards and history.",
            "Verify duel objectives and calculate competitive ratings.",
            "Prevent abuse, diagnose errors and maintain service security.",
          ],
        },
        {
          title: "Local storage and cookies",
          paragraphs: [
            "The access token is limited to the browser tab session. The refresh token is stored in an HttpOnly cookie restricted to session routes. An essential cookie stores the language, while local storage only keeps interface preferences and sign-out state.",
            "No third-party advertising or audience-tracking tool is currently integrated.",
          ],
        },
        {
          title: "Watcher and League Client",
          paragraphs: [
            "The Watcher runs on the player’s computer. LCU secrets are not sent to the browser or backend. Only information required to link the Riot ID, track the duel and submit the verified result is transmitted.",
          ],
        },
        {
          title: "Recipients and security",
          paragraphs: [
            "In the local version, data only circulates between Pinkward services required for operation. Access is protected using OAuth2/OIDC, JWT and scope controls. Pinkward does not sell player data.",
          ],
        },
        {
          title: "Retention periods",
          paragraphs: [
            "In development, data remains until it is deleted or the local databases are reset. A retention schedule appropriate to each purpose must be adopted and published before production.",
          ],
        },
        {
          title: "Individual rights",
          paragraphs: [
            "Depending on the applicable legal context, users may have rights of access, rectification, erasure, restriction, objection and portability. A contact and response procedure must be published before launch.",
            "In France, a complaint may be submitted to the CNIL where the relevant conditions are met.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "SERVICE RULES",
      title: "TERMS OF USE",
      introduction:
        "Core rules governing the use of Pinkward’s competitive features.",
      notice:
        "Development project: these terms are a functional baseline and must be reviewed and completed before public launch.",
      sections: [
        {
          title: "Account and access",
          paragraphs: [
            "Users are responsible for access to their local account and for the accuracy of information they choose to provide. They must not use another person’s account or Riot ID without permission.",
          ],
        },
        {
          title: "Competitive integrity",
          items: [
            "Do not falsify a result, identity or game state.",
            "Do not bypass the Watcher, authentication or security controls.",
            "Do not exploit bugs, automate requests abusively or disrupt other players.",
            "Bots are reserved for explicitly enabled test scenarios.",
          ],
        },
        {
          title: "Matches, results and ratings",
          paragraphs: [
            "TrueSkill 5v5 and Glicko-2 1v1 ratings depend on server-validated results. A game may be cancelled or excluded from ratings when it is incomplete, inconsistent or unverifiable.",
          ],
        },
        {
          title: "Local Watcher",
          paragraphs: [
            "The Watcher is limited to automating and verifying the custom games supported by Pinkward. It must not be modified or used to gain an in-game advantage.",
          ],
        },
        {
          title: "Availability and changes",
          paragraphs: [
            "This version is provided for development and testing. Features, rating rules, seasons and local data may be corrected, reset or temporarily unavailable.",
          ],
        },
        {
          title: "Suspension",
          paragraphs: [
            "Access may be restricted or suspended in cases of abuse, fraud, security threats or repeated breaches of these rules.",
          ],
        },
        {
          title: "Applicable law",
          paragraphs: [
            "The applicable law, dispute-resolution process and responsible party’s contact details must be specified before production.",
          ],
        },
      ],
    },
  },
};

export default function LegalPage({ document }: { document: LegalDocument }) {
  const { language } = useLanguage();
  const copy = documents[language][document];

  return (
    <div className="page legal-page">
      <PageTitle
        eyebrow={copy.eyebrow}
        title={copy.title}
        text={copy.introduction}
      />
      <aside className="legal-notice" role="note">
        <strong>{language === "fr" ? "À FINALISER" : "TO BE FINALISED"}</strong>
        <p>{copy.notice}</p>
      </aside>
      <div className="legal-sections">
        {copy.sections.map((section) => (
          <Card className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
      <p className="legal-updated">
        {language === "fr"
          ? "Dernière mise à jour : 29 août 2026"
          : "Last updated: 29 August 2026"}
      </p>
    </div>
  );
}
