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
  noticeLabel: string;
  notice: string;
  sections: Section[];
};

const documents: Record<"fr" | "en", Record<LegalDocument, DocumentCopy>> = {
  fr: {
    legal: {
      eyebrow: "INFORMATIONS LÉGALES",
      title: "MENTIONS LÉGALES",
      introduction:
        "Informations relatives à l’éditeur non professionnel, à l’hébergement et à l’utilisation de GYMS.LOL.",
      noticeLabel: "ÉDITEUR NON PROFESSIONNEL",
      notice:
        "GYMS.LOL est édité à titre personnel et non professionnel par une personne physique. Il ne s’agit ni d’une société ni d’une activité commerciale.",
      sections: [
        {
          title: "Éditeur non professionnel",
          paragraphs: [
            "GYMS.LOL est édité par une personne physique résidant en France, à titre non professionnel.",
            "Conformément à l’article 1-1, II, de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), l’éditeur a choisi de préserver son anonymat. Les éléments d’identification personnelle requis ont été communiqués à l’hébergeur.",
          ],
        },
        {
          title: "Direction de la publication",
          paragraphs: [
            "La direction de la publication est assurée par l’éditeur personne physique. Son identité n’est pas rendue publique dans le cadre du régime applicable aux éditeurs non professionnels.",
          ],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le service est hébergé par OVH SAS, société par actions simplifiée immatriculée au RCS de Lille Métropole sous le numéro 424 761 419, dont le siège social est situé 2 rue Kellermann, 59100 Roubaix, France.",
            "Site de l’hébergeur : www.ovhcloud.com.",
          ],
        },
        {
          title: "Contact, signalement et droit de réponse",
          paragraphs: [
            "Toute demande légale, demande de droit de réponse ou notification relative à un contenu peut être adressée à l’hébergeur, en indiquant précisément l’adresse du site et le contenu concerné, afin qu’elle soit transmise à l’éditeur.",
            "Les demandes concernant les données personnelles suivent la procédure indiquée dans la politique de confidentialité de GYMS.LOL.",
          ],
        },
        {
          title: "Nature du service",
          paragraphs: [
            "GYMS.LOL est un projet communautaire indépendant consacré à l’organisation et au suivi de parties personnalisées. Le service est actuellement proposé à titre non professionnel et sans vente de biens ou de services.",
            "Les présentes mentions devront être mises à jour si l’activité devient professionnelle ou commerciale.",
          ],
        },
        {
          title: "Propriété intellectuelle et marques tierces",
          paragraphs: [
            "Les éléments propres à GYMS.LOL sont protégés selon les droits applicables. League of Legends, Riot Games et leurs éléments graphiques appartiennent à leurs titulaires respectifs.",
            "GYMS.LOL est un projet communautaire indépendant, non approuvé, non sponsorisé et non affilié à Riot Games.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "L’éditeur met en œuvre des moyens raisonnables pour assurer l’exactitude et la disponibilité du service, sans pouvoir garantir une absence totale d’erreur ou d’interruption. Il ne saurait être tenu responsable au-delà des limites prévues par la loi.",
            "Les liens vers des services tiers sont fournis à titre pratique. Leur contenu et leur disponibilité relèvent de leurs éditeurs respectifs.",
          ],
        },
        {
          title: "Droit applicable",
          paragraphs: [
            "Les présentes mentions légales sont soumises au droit français, sous réserve des règles impératives éventuellement applicables.",
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "DONNÉES PERSONNELLES",
      title: "POLITIQUE DE CONFIDENTIALITÉ",
      introduction:
        "Cette politique explique quelles données GYMS.LOL traite, pourquoi elles sont utilisées et quels sont les droits des joueurs.",
      noticeLabel: "POLITIQUE APPLICABLE",
      notice:
        "L’éditeur individuel de GYMS.LOL agit en qualité de responsable du traitement. Les traitements sont limités au fonctionnement, à l’intégrité et à la sécurité du service.",
      sections: [
        {
          title: "Responsable du traitement et contact",
          paragraphs: [
            "Le responsable du traitement est l’éditeur individuel de GYMS.LOL, identifié auprès de l’hébergeur conformément aux mentions légales.",
            "Toute demande relative aux données personnelles peut être transmise selon la procédure de contact et de signalement indiquée dans les mentions légales, en précisant le compte concerné et l’objet de la demande.",
          ],
        },
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
          title: "Bases légales",
          items: [
            "L’exécution des conditions d’utilisation pour créer et administrer le compte, fournir les groupes, files, matchs, classements, historiques et évaluations.",
            "L’intérêt légitime de l’éditeur à sécuriser le service, prévenir la fraude, vérifier l’intégrité compétitive, diagnostiquer les incidents et défendre ses droits.",
            "Le consentement du joueur lorsqu’il choisit de lier son Riot ID ou de fournir une donnée facultative ; ce consentement peut être retiré en demandant la suppression de la liaison ou de la donnée concernée.",
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
            "Les données sont accessibles uniquement aux services GYMS.LOL et aux prestataires techniques nécessaires à l’hébergement, à l’authentification et à la sécurité. Les accès sont protégés par OAuth2/OIDC, JWT et des contrôles de périmètre. GYMS.LOL ne vend pas les données des joueurs.",
            "Aucun transfert volontaire de données vers un pays situé hors de l’Espace économique européen n’est organisé par GYMS.LOL. Les éventuels transferts propres à un prestataire sont encadrés par les garanties qu’il publie.",
          ],
        },
        {
          title: "Durées de conservation",
          items: [
            "Jetons de session : jusqu’à leur expiration, leur révocation ou la déconnexion.",
            "Compte, profil, Riot ID lié et évaluations : pendant la durée d’utilisation du compte, puis suppression ou anonymisation à la clôture du compte ou à la suite d’une demande recevable.",
            "Invitations, groupes et recherches : pendant leur durée de validité opérationnelle, puis suppression au plus tard dans les 30 jours suivant leur clôture ou expiration.",
            "Matchs, résultats et historique : pendant la durée nécessaire au classement, à l’historique et à l’intégrité des saisons ; ils sont anonymisés lorsque l’identification du joueur n’est plus nécessaire.",
            "Journaux de sécurité et de diagnostic : six mois au maximum, sauf conservation plus longue rendue nécessaire par un incident, une fraude ou un contentieux.",
          ],
        },
        {
          title: "Droits des personnes",
          paragraphs: [
            "Les utilisateurs peuvent demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de leurs données et, lorsque la base légale le permet, s’opposer au traitement ou retirer leur consentement. Une réponse est apportée dans les délais prévus par le RGPD, sous réserve de la vérification de l’identité du demandeur.",
            "Une réclamation peut être adressée à la CNIL sur www.cnil.fr si l’utilisateur estime que ses droits ne sont pas respectés.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "RÈGLES DU SERVICE",
      title: "CONDITIONS D’UTILISATION",
      introduction:
        "Règles essentielles applicables à l’utilisation des fonctionnalités compétitives de GYMS.LOL.",
      noticeLabel: "CONDITIONS APPLICABLES",
      notice:
        "L’accès à GYMS.LOL et l’utilisation de ses fonctionnalités impliquent l’acceptation des présentes conditions d’utilisation.",
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
            "Le Watcher est limité à l’automatisation et à la vérification des parties personnalisées prévues par GYMS.LOL. Il ne doit pas être modifié ou utilisé pour obtenir un avantage en jeu.",
          ],
        },
        {
          title: "Disponibilité et évolution",
          paragraphs: [
            "Le service peut évoluer afin d’améliorer ses fonctionnalités, sa sécurité ou ses règles compétitives. Une maintenance, un incident ou une mise à jour peut entraîner une indisponibilité temporaire.",
            "Les règles de classement ou de saison peuvent être adaptées avec une information préalable lorsqu’une modification affecte de manière importante les joueurs.",
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
            "Les présentes conditions sont régies par le droit français, sous réserve des règles impératives protégeant les utilisateurs dans leur pays de résidence.",
            "En cas de difficulté, l’utilisateur est invité à rechercher d’abord une solution amiable selon la procédure de contact indiquée dans les mentions légales. À défaut, le litige relève des juridictions compétentes déterminées par la loi.",
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
        "Information about GYMS.LOL’s non-professional publisher, hosting and use.",
      noticeLabel: "NON-PROFESSIONAL PUBLISHER",
      notice:
        "GYMS.LOL is personally published on a non-professional basis by an individual. It is neither a company nor a commercial activity.",
      sections: [
        {
          title: "Non-professional publisher",
          paragraphs: [
            "GYMS.LOL is published by an individual residing in France on a non-professional basis.",
            "Under Article 1-1(II) of French Act No. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN), the publisher has chosen to preserve their anonymity. The required personal identification details have been provided to the hosting provider.",
          ],
        },
        {
          title: "Publication director",
          paragraphs: [
            "The individual publisher acts as publication director. Their identity is not made public under the rules applicable to non-professional publishers.",
          ],
        },
        {
          title: "Hosting",
          paragraphs: [
            "The service is hosted by OVH SAS, a simplified joint-stock company registered with the Lille Métropole Trade and Companies Register under number 424 761 419, whose registered office is located at 2 rue Kellermann, 59100 Roubaix, France.",
            "Hosting provider website: www.ovhcloud.com.",
          ],
        },
        {
          title: "Contact, reporting and right of reply",
          paragraphs: [
            "Legal requests, right-of-reply requests or content notifications may be sent to the hosting provider, clearly identifying the website address and the content concerned, so they can be forwarded to the publisher.",
            "Requests concerning personal data follow the process described in GYMS.LOL’s privacy policy.",
          ],
        },
        {
          title: "Nature of the service",
          paragraphs: [
            "GYMS.LOL is an independent community project for organising and tracking custom games. The service is currently provided on a non-professional basis and does not sell goods or services.",
            "This legal notice must be updated if the activity becomes professional or commercial.",
          ],
        },
        {
          title: "Intellectual property and third-party marks",
          paragraphs: [
            "GYMS.LOL-specific materials are protected under applicable rights. League of Legends, Riot Games and their visual assets belong to their respective owners.",
            "GYMS.LOL is an independent community project and is not endorsed, sponsored by or affiliated with Riot Games.",
          ],
        },
        {
          title: "Liability",
          paragraphs: [
            "The publisher takes reasonable steps to ensure the accuracy and availability of the service but cannot guarantee that it will always be error-free or uninterrupted. Liability is not excluded beyond the limits permitted by law.",
            "Links to third-party services are provided for convenience. Their content and availability remain the responsibility of their respective publishers.",
          ],
        },
        {
          title: "Applicable law",
          paragraphs: [
            "This legal notice is governed by French law, subject to any mandatory rules that may apply.",
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "PERSONAL DATA",
      title: "PRIVACY POLICY",
      introduction:
        "This policy explains what data GYMS.LOL processes, why it is used and what rights players have.",
      noticeLabel: "APPLICABLE POLICY",
      notice:
        "The individual publisher of GYMS.LOL acts as data controller. Processing is limited to operating, protecting and preserving the integrity of the service.",
      sections: [
        {
          title: "Data controller and contact",
          paragraphs: [
            "The data controller is the individual publisher of GYMS.LOL, identified to the hosting provider in accordance with the legal notice.",
            "Personal-data requests may be submitted through the contact and reporting process described in the legal notice, specifying the relevant account and the purpose of the request.",
          ],
        },
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
          title: "Legal bases",
          items: [
            "Performance of the Terms of Use to create and administer accounts and provide parties, queues, matches, leaderboards, history and ratings.",
            "The publisher’s legitimate interests in securing the service, preventing fraud, verifying competitive integrity, diagnosing incidents and defending legal rights.",
            "Player consent when voluntarily linking a Riot ID or providing optional data; consent may be withdrawn by requesting removal of the relevant link or data.",
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
            "Data is only available to GYMS.LOL services and technical providers required for hosting, authentication and security. Access is protected using OAuth2/OIDC, JWT and scope controls. GYMS.LOL does not sell player data.",
            "GYMS.LOL does not intentionally arrange transfers outside the European Economic Area. Any transfers performed by a provider are governed by the safeguards published by that provider.",
          ],
        },
        {
          title: "Retention periods",
          items: [
            "Session tokens: until expiry, revocation or sign-out.",
            "Account, profile, linked Riot ID and ratings: while the account is used, followed by deletion or anonymisation when the account is closed or a valid request is received.",
            "Invitations, parties and searches: for their operational lifetime, then deleted no later than 30 days after closure or expiry.",
            "Matches, results and history: for as long as required for rankings, history and season integrity; they are anonymised when player identification is no longer necessary.",
            "Security and diagnostic logs: no longer than six months, unless an incident, fraud or legal dispute requires longer retention.",
          ],
        },
        {
          title: "Individual rights",
          paragraphs: [
            "Users may request access, rectification, erasure, restriction or portability and, where the legal basis allows, object to processing or withdraw consent. Requests are answered within the time limits set by the GDPR, subject to verification of the requester’s identity.",
            "A complaint may be submitted to the French data protection authority (CNIL) at www.cnil.fr if a user believes their rights have not been respected.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "SERVICE RULES",
      title: "TERMS OF USE",
      introduction:
        "Core rules governing the use of GYMS.LOL’s competitive features.",
      noticeLabel: "APPLICABLE TERMS",
      notice:
        "Accessing GYMS.LOL and using its features constitutes acceptance of these Terms of Use.",
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
            "The Watcher is limited to automating and verifying the custom games supported by GYMS.LOL. It must not be modified or used to gain an in-game advantage.",
          ],
        },
        {
          title: "Availability and changes",
          paragraphs: [
            "The service may evolve to improve its features, security or competitive rules. Maintenance, incidents or updates may cause temporary unavailability.",
            "Rating or season rules may be changed with prior notice when a change materially affects players.",
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
            "These Terms are governed by French law, subject to any mandatory protections applicable in the user’s country of residence.",
            "In the event of a dispute, users should first seek an amicable solution through the contact process described in the legal notice. Failing that, the dispute falls within the jurisdiction of the courts determined by applicable law.",
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
        <strong>{copy.noticeLabel}</strong>
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
          ? "Dernière mise à jour : 30 août 2026"
          : "Last updated: 30 August 2026"}
      </p>
    </div>
  );
}
