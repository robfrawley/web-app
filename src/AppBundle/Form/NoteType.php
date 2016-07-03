<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class NoteType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('message', TextareaType::class, [
            'description' => 'A brief record of points or ideas written down as an aid to memory',
        ]);
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class'         => 'AppBundle\Model\Note',
            'intention'          => 'note',
            'translation_domain' => 'AppBundle'
        ]);
    }

    public function getBlockPrefix()
    {
        return 'note';
    }
}